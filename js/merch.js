const placeholderImage = "assets/images/merch/placeholder.svg";
const merchData = Array.isArray(window.MERCH_DATA) ? window.MERCH_DATA : [];

const parseMerchPrice = (value) => {
  const numeric = Number(String(value || "$0").replace(/[^0-9.]/g, ""));
  return Number.isFinite(numeric) ? numeric : 0;
};

const getProductImages = (product) => {
  if (Array.isArray(product?.images) && product.images.length) {
    return product.images.map((image) => image || placeholderImage);
  }

  return [product?.image || placeholderImage];
};

const setFallbackImage = (img) => {
  if (!img) return;
  img.addEventListener('error', () => {
    if (img.src !== window.location.origin + '/' + placeholderImage) {
      img.src = placeholderImage;
      img.alt = 'Image coming soon';
    }
  }, { once: true });
};

const getStatusText = (status) => {
  if (status === 'sold-out') return 'OUT OF STOCK';
  if (status === 'coming-soon') return 'COMING SOON';
  return 'AVAILABLE';
};

const renderProductCard = (product) => {
  const article = document.createElement('article');
  article.className = 'merch-card';

  const imageWrap = document.createElement('div');
  imageWrap.className = 'merch-card__image';

  const image = document.createElement('img');
  image.src = product.image || placeholderImage;
  image.alt = `${product.name} product image`;
  image.loading = 'lazy';
  setFallbackImage(image);

  const imageLink = document.createElement('a');
  imageLink.href = `merch-item.html?id=${product.id}`;
  imageLink.setAttribute('aria-label', `View ${product.name} details`);

  const badge = document.createElement('span');
  badge.className = 'merch-card__status';
  badge.textContent = getStatusText(product.status);

  imageLink.appendChild(image);
  imageWrap.appendChild(imageLink);
  imageWrap.appendChild(badge);

  const info = document.createElement('div');
  info.className = 'merch-card__info';

  const category = document.createElement('p');
  category.className = 'merch-card__category';
  category.textContent = product.category;

  const name = document.createElement('h3');
  const nameLink = document.createElement('a');
  nameLink.href = `merch-item.html?id=${product.id}`;
  nameLink.textContent = product.name;
  name.appendChild(nameLink);

  const price = document.createElement('p');
  price.className = 'merch-card__price';
  price.textContent = product.price;

  const description = document.createElement('p');
  description.className = 'merch-card__description';
  description.textContent = product.description;

  const footer = document.createElement('div');
  footer.className = 'merch-card__footer';

  const detailsLink = document.createElement('a');
  detailsLink.className = 'button button-secondary merch-button';
  detailsLink.href = `merch-item.html?id=${product.id}`;
  detailsLink.textContent = 'View Details';

  footer.appendChild(detailsLink);
  info.append(category, name, price, description, footer);

  article.append(imageWrap, info);
  return article;
};

const getVisibleProducts = ({ query = '', category = 'all', sort = 'featured' } = {}) => {
  const normalizedQuery = query.trim().toLowerCase();

  const filtered = merchData.filter((product) => {
    const matchesCategory = category === 'all' || product.category === category;
    const haystack = `${product.name} ${product.category} ${product.description}`.toLowerCase();
    const matchesQuery = !normalizedQuery || haystack.includes(normalizedQuery);
    return matchesCategory && matchesQuery;
  });

  const sorted = [...filtered].sort((a, b) => {
    switch (sort) {
      case 'name-asc':
        return a.name.localeCompare(b.name);
      case 'name-desc':
        return b.name.localeCompare(a.name);
      case 'price-low':
        return parseMerchPrice(a.price) - parseMerchPrice(b.price);
      case 'price-high':
        return parseMerchPrice(b.price) - parseMerchPrice(a.price);
      case 'featured':
        return Number(Boolean(b.featured)) - Number(Boolean(a.featured)) || a.name.localeCompare(b.name);
      default:
        return Number(Boolean(b.featured)) - Number(Boolean(a.featured)) || a.name.localeCompare(b.name);
    }
  });

  return sorted;
};

const renderListPage = () => {
  const listRoot = document.querySelector('[data-page="merch-list"]');
  if (!listRoot) return;

  const merchGrid = document.getElementById('merch-grid');
  const emptyState = document.getElementById('merch-empty');
  const resultCount = document.getElementById('merch-count');
  const filterWrap = document.getElementById('merch-filters');
  const searchInput = document.getElementById('merch-search');
  const sortSelect = document.getElementById('merch-sort');
  const featuredGrid = document.getElementById('featured-products');

  if (!merchGrid || !filterWrap || !searchInput || !sortSelect) return;

  const categoryMap = [...new Set(['T-Shirts', 'Hoodies', 'Hats', 'Patches', 'Stickers', 'Posters', 'Other', ...merchData.map((product) => product.category)])];
  const filterButtons = ['all', ...categoryMap.filter(Boolean)];

  filterWrap.innerHTML = filterButtons
    .map((category) => {
      const label = category === 'all' ? 'All' : category;
      return `<button class="filter-button is-active" type="button" data-category="${category}">${label}</button>`;
    })
    .join('');

  const updateFilters = (category, search, sort) => {
    const visibleProducts = getVisibleProducts({ query: search, category, sort });
    merchGrid.innerHTML = '';

    if (!visibleProducts.length) {
      merchGrid.innerHTML = '';
      emptyState.hidden = false;
      resultCount.textContent = '0 PRODUCTS FOUND';
      return;
    }

    emptyState.hidden = true;
    resultCount.textContent = `${visibleProducts.length} PRODUCT${visibleProducts.length === 1 ? '' : 'S'} FOUND`;

    visibleProducts.forEach((product) => {
      merchGrid.appendChild(renderProductCard(product));
    });

    filterWrap.querySelectorAll('.filter-button').forEach((button) => {
      const isActive = (button.dataset.category || 'all') === category;
      button.classList.toggle('is-active', isActive);
      button.setAttribute('aria-pressed', String(isActive));
    });
  };

  const featuredProducts = merchData.filter((product) => product.featured);
  if (featuredGrid) {
    featuredGrid.innerHTML = '';
    featuredProducts.slice(0, 2).forEach((product) => {
      const featureCard = document.createElement('article');
      featureCard.className = 'feature-merch-card';
      featureCard.innerHTML = `
        <div class="feature-merch-card__image">
          <a href="merch-item.html?id=${product.id}" aria-label="View ${product.name} details">
            <img src="${product.image || placeholderImage}" alt="${product.name} product image" loading="lazy" />
          </a>
          <span class="merch-card__status">${getStatusText(product.status)}</span>
        </div>
        <div class="feature-merch-card__content">
          <p class="eyebrow">FEATURED</p>
          <h3><a href="merch-item.html?id=${product.id}">${product.name}</a></h3>
          <p class="merch-card__price">${product.price}</p>
          <p>${product.description}</p>
          <a href="merch-item.html?id=${product.id}" class="button button-secondary merch-button">View Details</a>
        </div>
      `;
      const image = featureCard.querySelector('img');
      setFallbackImage(image);
      featuredGrid.appendChild(featureCard);
    });
  }

  let activeCategory = 'all';
  let activeSort = sortSelect.value;

  filterWrap.addEventListener('click', (event) => {
    const button = event.target.closest('.filter-button');
    if (!button) return;
    activeCategory = button.dataset.category || 'all';
    updateFilters(activeCategory, searchInput.value, activeSort);
  });

  searchInput.addEventListener('input', (event) => {
    updateFilters(activeCategory, event.target.value, activeSort);
  });

  sortSelect.addEventListener('change', (event) => {
    activeSort = event.target.value;
    updateFilters(activeCategory, searchInput.value, activeSort);
  });

  updateFilters(activeCategory, searchInput.value, activeSort);
};

const renderProductPage = () => {
  const productPage = document.querySelector('[data-page="merch-item"]');
  if (!productPage) return;

  const productId = new URLSearchParams(window.location.search).get('id');
  const product = merchData.find((item) => item.id === productId) || merchData[0];
  const detailRoot = document.getElementById('merch-detail');

  if (!detailRoot) return;

  if (!product) {
    detailRoot.innerHTML = `
      <div class="product-not-found">
        <h2>Product not found.</h2>
        <p>Try another product or return to the merch gallery.</p>
        <a href="merch.html" class="button button-primary">Back to Merch</a>
      </div>
    `;
    return;
  }

  const productImages = getProductImages(product);
  const statusText = getStatusText(product.status);
  const buyLabel = product.status === 'sold-out' ? 'Out of Stock' : product.link ? 'Buy Now' : 'Coming Soon';
  const isDisabled = product.status === 'sold-out' || !product.link;
  const fullDescription = Array.isArray(product.fullDescription) ? product.fullDescription : [];
  const features = Array.isArray(product.features) ? product.features : [];

  detailRoot.innerHTML = `
    <div class="product-detail__gallery" aria-live="polite">
      <div class="product-detail__main-image">
        <img src="${productImages[0]}" alt="${product.name} main image" data-role="main-image" loading="eager" />
      </div>
      <div class="product-detail__thumbs" aria-label="Product gallery thumbnails">
        ${productImages
          .map(
            (image, index) => `
              <button class="product-detail__thumb ${index === 0 ? 'is-active' : ''}" type="button" data-index="${index}" aria-label="View product image ${index + 1}">
                <img src="${image}" alt="${product.name} thumbnail ${index + 1}" loading="lazy" />
              </button>
            `
          )
          .join('')}
      </div>
    </div>

    <div class="product-detail__content">
      <p class="eyebrow">${product.category}</p>
      <h1>${product.name}</h1>
      <div class="product-detail__meta">
        <span class="product-detail__price">${product.price}</span>
        <span class="product-status product-status--${product.status}" id="product-stock-status">${statusText}</span>
      </div>
      <p class="product-detail__description">${product.description}</p>
      ${
        fullDescription.length
          ? `<div class="product-detail__full-description">
              ${fullDescription.map((paragraph) => `<p>${paragraph}</p>`).join('')}
              ${features.length ? `<ul>${features.map((feature) => `<li>${feature}</li>`).join('')}</ul>` : ''}
            </div>`
          : ''
      }

      <div class="product-detail__actions">
        <button class="button button-primary js-add-to-cart" data-product-id="${product.id}" type="button" ${product.status === 'sold-out' ? 'disabled aria-describedby="product-stock-status"' : ''}>ADD TO CART</button>
        ${
          product.link
            ? `<a class="button button-secondary" href="${product.link}" target="_blank" rel="noreferrer noopener" ${isDisabled ? 'aria-disabled="true" tabindex="-1"' : ''}>${buyLabel}</a>`
            : `<button class="button button-secondary" type="button" disabled>${buyLabel}</button>`
        }
        <a class="button button-secondary" href="merch.html">Back to Merch</a>
      </div>

      ${
        product.sizes || product.brand || product.type || product.colors || product.fit || product.closure || product.materials || product.care || product.notes
          ? `
            <div class="product-detail__specs">
              ${product.sizes ? `<div><h3>Size</h3><p>${product.sizes.join(', ')}</p></div>` : ''}
              ${product.brand ? `<div><h3>Brand</h3><p>${product.brand}</p></div>` : ''}
              ${product.type ? `<div><h3>Type</h3><p>${product.type}</p></div>` : ''}
              ${product.colors ? `<div><h3>Color</h3><p>${product.colors.join(', ')}</p></div>` : ''}
              ${product.closure ? `<div><h3>Closure</h3><p>${product.closure}</p></div>` : ''}
              ${product.fit ? `<div><h3>Fit</h3><p>${product.fit}</p></div>` : ''}
              ${product.materials ? `<div><h3>Materials</h3><p>${product.materials}</p></div>` : ''}
              ${product.care ? `<div><h3>Care</h3><p>${product.care}</p></div>` : ''}
              ${product.notes ? `<div><h3>Notes</h3><p>${product.notes}</p></div>` : ''}
            </div>
          `
          : ''
      }
    </div>
  `;

  const mainImage = detailRoot.querySelector('[data-role="main-image"]');
  if (mainImage) setFallbackImage(mainImage);

  const thumbButtons = detailRoot.querySelectorAll('.product-detail__thumb');
  thumbButtons.forEach((button) => {
    const index = Number(button.dataset.index || 0);
    const image = button.querySelector('img');
    if (image) setFallbackImage(image);

    button.addEventListener('click', () => {
      const mainImageEl = detailRoot.querySelector('[data-role="main-image"]');
      const nextImage = productImages[index] || placeholderImage;
      if (mainImageEl) mainImageEl.src = nextImage;
      thumbButtons.forEach((thumb) => thumb.classList.toggle('is-active', thumb === button));
    });
  });
};

const initMerch = () => {
  if (document.body.dataset.page === 'merch-list') {
    renderListPage();
  }

  if (document.body.dataset.page === 'merch-item') {
    renderProductPage();
  }
};

document.addEventListener('DOMContentLoaded', initMerch);
