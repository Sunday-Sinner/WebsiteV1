const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
const CART_KEY = 'sunday-sinner-cart';

const getCart = () => {
  try {
    const raw = window.localStorage.getItem(CART_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (error) {
    return [];
  }
};

const saveCart = (cart) => {
  window.localStorage.setItem(CART_KEY, JSON.stringify(cart));
};

const parsePrice = (value) => {
  const numeric = Number(String(value || '$0').replace(/[^0-9.]/g, ''));
  return Number.isFinite(numeric) ? numeric : 0;
};

const formatCurrency = (value) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

const getMerchProduct = (productId) => {
  if (!Array.isArray(window.MERCH_DATA)) return null;
  return window.MERCH_DATA.find((product) => product.id === productId) || null;
};

const updateCartBadge = () => {
  const cartButton = document.querySelector('.cart-button');
  const cartCount = document.querySelector('.cart-button__count');
  const cart = getCart();
  const total = cart.reduce((sum, item) => sum + Number(item.quantity || 0), 0);

  if (cartButton) {
    cartButton.setAttribute('aria-label', `Open shopping cart with ${total} item${total === 1 ? '' : 's'}`);
  }

  if (cartCount) {
    cartCount.textContent = String(total);
  }
};

const showCartToast = (message) => {
  let toast = document.querySelector('.cart-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'cart-toast';
    document.body.appendChild(toast);
  }

  toast.textContent = message;
  toast.classList.add('is-visible');
  clearTimeout(showCartToast.timeoutId);
  showCartToast.timeoutId = window.setTimeout(() => toast.classList.remove('is-visible'), 1800);
};

const addToCart = (productId, quantity = 1) => {
  const product = getMerchProduct(productId);
  if (!product) return;

  const cart = getCart();
  const index = cart.findIndex((item) => item.id === productId);
  if (index >= 0) {
    cart[index].quantity += quantity;
  } else {
    cart.push({
      id: product.id,
      name: product.name,
      image: product.image || product.images?.[0] || 'assets/images/merch/placeholder.svg',
      price: parsePrice(product.price),
      quantity,
    });
  }

  saveCart(cart);
  updateCartBadge();
  renderCartDrawer();
  showCartToast(`ADDED TO CART\n${product.name}`);
};

const removeFromCart = (productId) => {
  const nextCart = getCart().filter((item) => item.id !== productId);
  saveCart(nextCart);
  updateCartBadge();
  renderCartDrawer();
};

const updateCartItemQuantity = (productId, nextQuantity) => {
  const cart = getCart();
  const nextCart = cart
    .map((item) => {
      if (item.id !== productId) return item;
      return { ...item, quantity: Math.max(0, Number(nextQuantity) || 0) };
    })
    .filter((item) => item.quantity > 0);

  saveCart(nextCart);
  updateCartBadge();
  renderCartDrawer();
};

const openCartDrawer = () => {
  const drawer = document.getElementById('cart-drawer');
  if (!drawer) return;
  drawer.classList.add('is-open');
  renderCartDrawer();
};

const closeCartDrawer = () => {
  const drawer = document.getElementById('cart-drawer');
  if (drawer) {
    drawer.classList.remove('is-open');
  }
};

const createCartDrawer = () => {
  if (document.getElementById('cart-drawer')) return;

  const drawer = document.createElement('aside');
  drawer.id = 'cart-drawer';
  drawer.className = 'cart-drawer';
  drawer.setAttribute('aria-hidden', 'true');
  drawer.innerHTML = `
    <div class="cart-drawer__backdrop" data-cart-close="true"></div>
    <div class="cart-drawer__panel" role="dialog" aria-modal="true" aria-labelledby="cart-heading">
      <div class="cart-drawer__header">
        <h2 id="cart-heading">SUNDAY SINNER CART</h2>
        <button type="button" class="cart-drawer__close" aria-label="Close cart">×</button>
      </div>
      <div class="cart-drawer__items"></div>
      <div class="cart-drawer__footer">
        <div class="cart-drawer__totals">
          <span>Subtotal</span>
          <strong class="cart-drawer__subtotal">$0.00</strong>
        </div>
        <div class="cart-drawer__actions">
          <button type="button" class="button button-secondary cart-drawer__continue">CONTINUE SHOPPING</button>
          <button type="button" class="button button-primary cart-drawer__checkout">CHECKOUT</button>
        </div>
      </div>
    </div>
  `;

  drawer.querySelector('.cart-drawer__close').addEventListener('click', closeCartDrawer);
  drawer.querySelector('[data-cart-close="true"]').addEventListener('click', closeCartDrawer);
  drawer.querySelector('.cart-drawer__continue').addEventListener('click', closeCartDrawer);
  drawer.querySelector('.cart-drawer__checkout').addEventListener('click', () => {
    const config = window.SUNDAY_SINNER_STORE || {};
    const checkoutUrl = config.checkoutUrl || '';

    if (checkoutUrl) {
      window.location.href = checkoutUrl;
      return;
    }

    showCartToast('Checkout is not configured yet. Add a hosted checkout URL to window.SUNDAY_SINNER_STORE.checkoutUrl.');
  });

  document.body.appendChild(drawer);
};

const renderCartDrawer = () => {
  createCartDrawer();
  const drawer = document.getElementById('cart-drawer');
  if (!drawer) return;

  const itemsRoot = drawer.querySelector('.cart-drawer__items');
  const subtotalNode = drawer.querySelector('.cart-drawer__subtotal');
  const cart = getCart();

  if (!cart.length) {
    itemsRoot.innerHTML = `
      <div class="cart-drawer__empty">
        <p>Your cart is empty.</p>
      </div>
    `;
    subtotalNode.textContent = '$0.00';
    return;
  }

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  subtotalNode.textContent = formatCurrency(subtotal);

  itemsRoot.innerHTML = cart
    .map((item) => `
      <article class="cart-item">
        <img src="${item.image || 'assets/images/merch/placeholder.svg'}" alt="${item.name}" class="cart-item__image" loading="lazy" />
        <div class="cart-item__body">
          <div class="cart-item__topline">
            <h3>${item.name}</h3>
            <button type="button" class="cart-item__remove" data-remove-id="${item.id}" aria-label="Remove ${item.name}">Remove</button>
          </div>
          <p>${formatCurrency(item.price)}</p>
          <div class="cart-item__controls">
            <button type="button" class="cart-item__step" data-quantity-id="${item.id}" data-direction="decrease" aria-label="Decrease quantity for ${item.name}">−</button>
            <span>${item.quantity}</span>
            <button type="button" class="cart-item__step" data-quantity-id="${item.id}" data-direction="increase" aria-label="Increase quantity for ${item.name}">+</button>
          </div>
        </div>
      </article>
    `)
    .join('');

  itemsRoot.querySelectorAll('[data-remove-id]').forEach((button) => {
    button.addEventListener('click', () => removeFromCart(button.dataset.removeId));
  });

  itemsRoot.querySelectorAll('[data-quantity-id]').forEach((button) => {
    button.addEventListener('click', () => {
      const productId = button.dataset.quantityId;
      const direction = button.dataset.direction;
      const cartItem = cart.find((entry) => entry.id === productId);
      if (!cartItem) return;
      const nextQuantity = direction === 'increase' ? cartItem.quantity + 1 : cartItem.quantity - 1;
      updateCartItemQuantity(productId, nextQuantity);
    });
  });
};

const initCart = () => {
  const nav = document.querySelector('.nav');
  if (!nav || document.querySelector('.cart-button')) {
    updateCartBadge();
    return;
  }

  const cartButton = document.createElement('button');
  cartButton.type = 'button';
  cartButton.className = 'cart-button';
  cartButton.setAttribute('aria-label', 'Open shopping cart');
  cartButton.innerHTML = `
    <span class="cart-button__label">CART</span>
    <span class="cart-button__count">0</span>
  `;
  cartButton.addEventListener('click', openCartDrawer);
  nav.appendChild(cartButton);

  const cartDrawer = createCartDrawer();
  if (cartDrawer) {
    cartDrawer.setAttribute('aria-hidden', 'false');
  }

  updateCartBadge();
  renderCartDrawer();
};

const initNav = () => {
  const navToggle = document.querySelector('.nav-toggle');
  const navMenu = document.querySelector('.nav-menu');
  const navLinks = document.querySelectorAll('.nav-menu a');

  if (!navToggle || !navMenu) return;

  const closeMenu = () => {
    navMenu.classList.remove('is-open');
    navToggle.setAttribute('aria-expanded', 'false');
  };

  navToggle.addEventListener('click', () => {
    const isOpen = navMenu.classList.toggle('is-open');
    navToggle.setAttribute('aria-expanded', String(isOpen));
  });

  navLinks.forEach((link) => {
    link.addEventListener('click', () => {
      closeMenu();
    });
  });

  document.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof Node)) return;
    if (!navMenu.contains(target) && !navToggle.contains(target)) {
      closeMenu();
    }
  });
};

const setActiveLink = () => {
  const links = document.querySelectorAll('.nav-menu a');
  if (!links.length) return;

  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  const sections = document.querySelectorAll('main section[id]');

  const update = () => {
    let currentId = null;

    if (sections.length) {
      const scrollAnchor = [...sections].reduce((best, section) => {
        const top = section.offsetTop - 110;
        if (window.scrollY >= top) {
          return section.id;
        }
        return best;
      }, null);

      currentId = scrollAnchor;
    }

    links.forEach((link) => {
      const href = link.getAttribute('href') || '';
      const target = href.split('#')[0] || 'index.html';
      const fileName = target.split('/').pop() || 'index.html';
      const isCurrentPage = !href.includes('#') && (fileName === currentPage || (currentPage === 'merch-item.html' && fileName === 'merch.html'));
      const isCurrentSection = href.startsWith('#') && currentId && href === `#${currentId}`;
      link.classList.toggle('is-active', isCurrentPage || isCurrentSection);
    });
  };

  update();
  if (sections.length) {
    window.addEventListener('scroll', update, { passive: true });
  }
};

const initReveal = () => {
  if (reducedMotionQuery.matches) {
    document.querySelectorAll('.reveal').forEach((element) => element.classList.add('is-visible'));
    return;
  }

  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.18 }
  );

  document.querySelectorAll('.reveal').forEach((element) => revealObserver.observe(element));
};

const initTrackAccordions = () => {
  const panels = document.querySelectorAll('.track-panel');

  panels.forEach((panel) => {
    const trigger = panel.querySelector('.track-trigger');
    if (!trigger) return;

    trigger.addEventListener('click', () => {
      const isOpen = panel.classList.contains('is-open');

      panels.forEach((item) => {
        const itemTrigger = item.querySelector('.track-trigger');
        if (!itemTrigger) return;

        item.classList.remove('is-open');
        itemTrigger.setAttribute('aria-expanded', 'false');
      });

      if (!isOpen) {
        panel.classList.add('is-open');
        trigger.setAttribute('aria-expanded', 'true');
      }
    });
  });
};

const initStoryCards = () => {
  const storyButtons = document.querySelectorAll('.story-card');
  const storyPanels = document.querySelectorAll('.story-detail');

  if (!storyButtons.length || !storyPanels.length) return;

  storyButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const story = button.dataset.story;

      storyButtons.forEach((item) => item.classList.toggle('is-active', item === button));
      storyPanels.forEach((panel) => {
        const isVisible = panel.dataset.storyPanel === story;
        panel.classList.toggle('is-visible', isVisible);
      });
    });
  });
};

const initStoryTimeline = () => {
  const timeline = document.querySelector('.story-timeline');
  const milestones = [...document.querySelectorAll('[data-story-milestone]')];
  const links = [...document.querySelectorAll('.story-timeline-nav a')];

  if (!timeline || !milestones.length || !links.length) return;

  const updateActiveMilestone = (activeIndex) => {
    milestones.forEach((milestone, index) => {
      milestone.classList.toggle('is-current', index === activeIndex);
      milestone.classList.toggle('is-passed', index < activeIndex);
    });
    links.forEach((link, index) => {
      if (index === activeIndex) {
        link.classList.add('is-current');
        link.setAttribute('aria-current', 'step');
      } else {
        link.classList.remove('is-current');
        link.removeAttribute('aria-current');
      }
    });
    timeline.style.setProperty('--story-progress', `${((activeIndex + 1) / milestones.length) * 100}%`);
  };

  links.forEach((link, index) => {
    link.addEventListener('click', () => updateActiveMilestone(index));
  });

  updateActiveMilestone(0);

  if (!('IntersectionObserver' in window)) {
    milestones.forEach((milestone) => milestone.classList.add('is-visible'));
    return;
  }

  const milestoneObserver = new IntersectionObserver(
    (entries) => {
      const visibleMilestones = entries
        .filter((entry) => entry.isIntersecting)
        .sort((first, second) => first.boundingClientRect.top - second.boundingClientRect.top);
      if (!visibleMilestones.length) return;

      const activeIndex = milestones.indexOf(visibleMilestones[0].target);
      if (activeIndex >= 0) updateActiveMilestone(activeIndex);
    },
    { rootMargin: '-28% 0px -48% 0px', threshold: 0 }
  );
  milestones.forEach((milestone) => milestoneObserver.observe(milestone));
  milestones.forEach((milestone) => milestoneObserver.observe(milestone));
};

const initPathButtons = () => {
  const pathButtons = document.querySelectorAll('.path-button');
  const pathPanels = document.querySelectorAll('.path-view');

  if (!pathButtons.length || !pathPanels.length) return;

  pathButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const path = button.dataset.path;

      pathButtons.forEach((item) => item.classList.toggle('is-active', item === button));
      pathPanels.forEach((panel) => {
        const isVisible = panel.dataset.pathPanel === path;
        panel.classList.toggle('is-hidden', !isVisible);
      });
    });
  });
};

const initGalleryFilters = () => {
  const filterButtons = document.querySelectorAll('.filter-button');
  const galleryItems = document.querySelectorAll('.gallery-item');

  if (!filterButtons.length || !galleryItems.length) return;

  filterButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const filter = button.dataset.filter;
      filterButtons.forEach((item) => item.classList.toggle('is-active', item === button));

      galleryItems.forEach((item) => {
        const match = filter === 'all' || item.dataset.category === filter;
        item.style.display = match ? '' : 'none';
      });
    });
  });
};

const initLightbox = () => {
  const lightbox = document.getElementById('lightbox');
  const image = document.getElementById('lightbox-image');
  const title = document.getElementById('lightbox-title');
  const category = document.getElementById('lightbox-category');
  const caption = document.getElementById('lightbox-caption');
  const closeButton = document.querySelector('.lightbox-close');
  const backdrop = document.querySelector('.lightbox-backdrop');
  const prevButton = document.querySelector('.lightbox-prev');
  const nextButton = document.querySelector('.lightbox-next');
  const galleryCards = Array.from(document.querySelectorAll('.gallery-card, .gallery-item'));

  if (!lightbox || !image || !title || !category || !closeButton || !backdrop) return;

  let currentItems = [];
  let currentIndex = 0;

  const normalizeCategory = (value) => {
    if (!value) return 'Gallery';
    return value
      .split('-')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  };

  const closeLightbox = () => {
    lightbox.classList.remove('is-open');
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  };

  const openLightbox = (card, index) => {
    const source = card.getAttribute('data-image');
    const cardTitle = card.getAttribute('data-title');
    const cardCaption = card.getAttribute('data-caption');
    const cardCategory = card.getAttribute('data-category');

    if (!source || !cardTitle) return;

    currentItems = galleryCards.filter((item) => item.getAttribute('data-image'));
    currentIndex = index ?? currentItems.indexOf(card);

    image.src = source;
    image.alt = `${cardTitle} artwork`;
    title.textContent = cardTitle;
    category.textContent = normalizeCategory(cardCategory || 'Gallery');
    if (caption) {
      caption.textContent = cardCaption || '';
    }
    lightbox.classList.add('is-open');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  };

  const moveLightbox = (direction) => {
    if (!currentItems.length) return;
    currentIndex = (currentIndex + direction + currentItems.length) % currentItems.length;
    const item = currentItems[currentIndex];
    if (item) openLightbox(item, currentIndex);
  };

  galleryCards.forEach((card, index) => {
    card.addEventListener('click', () => openLightbox(card, index));
  });

  closeButton.addEventListener('click', closeLightbox);
  backdrop.addEventListener('click', closeLightbox);

  if (prevButton) {
    prevButton.addEventListener('click', () => moveLightbox(-1));
  }

  if (nextButton) {
    nextButton.addEventListener('click', () => moveLightbox(1));
  }

  document.addEventListener('keydown', (event) => {
    if (!lightbox.classList.contains('is-open')) return;

    if (event.key === 'Escape') {
      closeLightbox();
      return;
    }

    if (event.key === 'ArrowLeft') {
      moveLightbox(-1);
    }

    if (event.key === 'ArrowRight') {
      moveLightbox(1);
    }
  });
};

const initContactForms = () => {
  const scrollTargets = document.querySelectorAll('[data-target]');
  scrollTargets.forEach((button) => {
    button.addEventListener('click', () => {
      const targetId = button.getAttribute('data-target');
      const target = document.getElementById(targetId);
      if (!target) return;
      target.scrollIntoView({ behavior: reducedMotionQuery.matches ? 'auto' : 'smooth', block: 'start' });
      const input = target.querySelector('input, textarea, select');
      if (input) input.focus();
    });
  });

  document.querySelectorAll('form[data-form-type]').forEach((form) => {
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const success = form.querySelector('.form-success');
      const formData = new FormData(form);
      const payload = Object.fromEntries(formData.entries());

      if (success) {
        success.textContent = 'Sending...';
      }

      try {
        const config = window.SUNDAY_SINNER_STORE || {};
        const endpoint = config.contactEndpoint || '/api/contact';
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            formType: form.dataset.formType || 'contact',
            ...payload,
          }),
        });

        const result = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(result.message || 'Unable to send your message right now.');
        }

        if (success) {
          success.textContent = 'Message sent. Thanks — I’ll be in touch.';
        }
        form.reset();
      } catch (error) {
        if (success) {
          success.textContent = error.message || 'Something went wrong. Please try again later.';
        }
      }
    });
  });
};

document.addEventListener('DOMContentLoaded', () => {
  window.SUNDAY_SINNER_STORE = window.SUNDAY_SINNER_STORE || {
    contactEndpoint: '/api/contact',
    checkoutUrl: '',
  };

  initCart();
  initNav();
  setActiveLink();
  initReveal();
  initTrackAccordions();
  initStoryCards();
  initStoryTimeline();
  initPathButtons();
  initGalleryFilters();
  initLightbox();
  initContactForms();
});

document.addEventListener('click', (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;

  const addButton = target.closest('.js-add-to-cart');
  if (addButton) {
    const productId = addButton.dataset.productId;
    if (productId) {
      addToCart(productId, 1);
    }
  }
});
