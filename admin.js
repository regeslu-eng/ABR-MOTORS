(() => {
  'use strict';

  const config = window.ABR_SUPABASE;
  const api = window.supabase.createClient(config.url, config.publishableKey, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
  });

  const $ = (id) => document.getElementById(id);
  const els = {
    loginView: $('loginView'), appView: $('appView'), loginForm: $('loginForm'),
    loginEmail: $('loginEmail'), loginPassword: $('loginPassword'), loginMessage: $('loginMessage'),
    loginButton: $('loginButton'), togglePassword: $('togglePassword'), logoutButton: $('logoutButton'),
    adminName: $('adminName'), adminEmail: $('adminEmail'), adminInitial: $('adminInitial'),
    inventoryList: $('inventoryList'), inventoryLoading: $('inventoryLoading'), emptyState: $('emptyState'),
    adminSearch: $('adminSearch'), adminFilter: $('adminFilter'), refreshButton: $('refreshButton'),
    newMotoButton: $('newMotoButton'), motoDialog: $('motoDialog'), motoForm: $('motoForm'),
    closeDialogButton: $('closeDialogButton'), cancelDialogButton: $('cancelDialogButton'),
    deleteMotoButton: $('deleteMotoButton'), saveMotoButton: $('saveMotoButton'), saveStatus: $('saveStatus'),
    currentMedia: $('currentMedia'), motoImages: $('motoImages'), motoVideo: $('motoVideo'), toast: $('toast')
  };

  const fields = {
    id: $('motoId'), code: $('motoCode'), name: $('motoName'), brand: $('motoBrand'), model: $('motoModel'),
    year: $('motoYear'), price: $('motoPrice'), engine: $('motoEngine'), mileage: $('motoMileage'),
    category: $('motoCategory'), status: $('motoStatus'), availability: $('motoAvailability'),
    order: $('motoOrder'), arrivalDate: $('motoArrivalDate'), location: $('motoLocation'),
    visible: $('motoVisible'), featured: $('motoFeatured'), transmission: $('motoTransmission'),
    fuel: $('motoFuel'), start: $('motoStart'), documentation: $('motoDocumentation'),
    description: $('motoDescription')
  };

  let currentUser = null;
  let inventory = [];
  let categories = [];
  let currentMoto = null;
  let toastTimer = null;

  const esc = (value = '') => String(value).replace(/[&<>'"]/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  })[char]);
  const money = (value) => value == null || value === ''
    ? 'Precio por confirmar'
    : new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(Number(value));
  const categoryName = (moto) => {
    const category = Array.isArray(moto.categories) ? moto.categories[0] : moto.categories;
    return category?.name || 'Sin categoría';
  };
  const mediaUrl = (media) => {
    if (!media) return 'assets/portada-inicio.jpg';
    if (/^(https?:|data:|blob:)/i.test(media.url || '')) return media.url;
    if (media.url) return media.url;
    if (media.storage_path) return `${config.url}/storage/v1/object/public/${config.bucket}/${media.storage_path}`;
    return 'assets/portada-inicio.jpg';
  };
  const primaryImage = (moto) => {
    const images = (moto.motorcycle_media || []).filter((item) => item.media_type === 'image');
    return mediaUrl(images.find((item) => item.is_primary) || images[0]);
  };
  const showToast = (message, type = 'success') => {
    clearTimeout(toastTimer);
    els.toast.textContent = message;
    els.toast.className = `toast ${type} show`;
    toastTimer = setTimeout(() => els.toast.classList.remove('show'), 3200);
  };
  const refreshIcons = () => window.lucide?.createIcons();

  async function verifyAdmin(user) {
    const { data, error } = await api.from('admin_users')
      .select('user_id,email,full_name,active')
      .eq('user_id', user.id)
      .eq('active', true)
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new Error('Esta cuenta no tiene permisos de administración.');
    return data;
  }

  async function enterApp(session) {
    const admin = await verifyAdmin(session.user);
    currentUser = session.user;
    els.adminName.textContent = admin.full_name || 'Administrador';
    els.adminEmail.textContent = admin.email || session.user.email || '';
    els.adminInitial.textContent = (admin.full_name || admin.email || 'A').trim().charAt(0).toUpperCase();
    els.loginView.hidden = true;
    els.appView.hidden = false;
    refreshIcons();
    await Promise.all([loadCategories(), loadInventory()]);
  }

  function leaveApp() {
    currentUser = null;
    els.appView.hidden = true;
    els.loginView.hidden = false;
    els.loginPassword.value = '';
    refreshIcons();
  }

  async function boot() {
    refreshIcons();
    const { data: { session } } = await api.auth.getSession();
    if (!session) return leaveApp();
    try {
      await enterApp(session);
    } catch (error) {
      await api.auth.signOut();
      leaveApp();
      els.loginMessage.textContent = error.message;
    }
  }

  async function loadCategories() {
    const { data, error } = await api.from('categories').select('id,name,slug,display_order,active').order('display_order');
    if (error) throw error;
    categories = data || [];
    fields.category.innerHTML = '<option value="">Sin categoría</option>' + categories
      .filter((item) => item.active)
      .map((item) => `<option value="${item.id}">${esc(item.name)}</option>`).join('');
  }

  async function loadInventory() {
    els.inventoryLoading.hidden = false;
    els.inventoryList.hidden = true;
    els.emptyState.hidden = true;
    const { data, error } = await api.from('motorcycles')
      .select('*,categories(id,name,slug),motorcycle_media(id,media_type,url,storage_path,caption,is_primary,sort_order)')
      .is('deleted_at', null)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true });
    els.inventoryLoading.hidden = true;
    if (error) {
      showToast(`No se pudo cargar el inventario: ${error.message}`, 'error');
      return;
    }
    inventory = (data || []).map((moto) => ({
      ...moto,
      motorcycle_media: [...(moto.motorcycle_media || [])].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
    }));
    updateStats();
    renderInventory();
  }

  function updateStats() {
    const available = inventory.filter((item) => item.status !== 'vendida');
    $('statTotal').textContent = inventory.length;
    $('statSold').textContent = inventory.filter((item) => item.status === 'vendida').length;
    $('statBranch').textContent = available.filter((item) => categoryName(item) === 'En sucursal').length;
    $('statArrival').textContent = available.filter((item) => categoryName(item).toLowerCase().includes('noviembre')).length;
    $('statSoon').textContent = available.filter((item) => categoryName(item) === 'Próximamente').length;
  }

  function filteredInventory() {
    const query = els.adminSearch.value.trim().toLowerCase();
    const filter = els.adminFilter.value;
    return inventory.filter((moto) => {
      const haystack = `${moto.code} ${moto.name} ${moto.brand || ''} ${categoryName(moto)}`.toLowerCase();
      if (query && !haystack.includes(query)) return false;
      if (filter === 'sold') return moto.status === 'vendida';
      if (filter === 'hidden') return !moto.visible;
      if (moto.status === 'vendida' && filter !== 'all') return false;
      if (filter === 'branch') return categoryName(moto) === 'En sucursal';
      if (filter === 'arrival') return categoryName(moto).toLowerCase().includes('noviembre');
      if (filter === 'soon') return categoryName(moto) === 'Próximamente';
      return true;
    });
  }

  function badgeFor(moto) {
    if (!moto.visible) return '<span class="badge hidden">Oculta</span>';
    if (moto.status === 'vendida') return '<span class="badge sold">Vendida</span>';
    if (moto.status === 'apartada') return '<span class="badge">Apartada</span>';
    return `<span class="badge available">${esc(categoryName(moto))}</span>`;
  }

  function renderInventory() {
    const items = filteredInventory();
    els.inventoryList.hidden = items.length === 0;
    els.emptyState.hidden = items.length > 0;
    els.inventoryList.innerHTML = items.map((moto) => `
      <article class="inventory-row" data-id="${moto.id}">
        <img class="bike-photo" src="${esc(primaryImage(moto))}" alt="" onerror="this.src='assets/portada-inicio.jpg'">
        <div class="bike-name"><strong>${esc(moto.name)}</strong><span>${esc(moto.code)} · ${esc(moto.brand || 'Sin marca')}</span></div>
        <div class="bike-price">${money(moto.price)}</div>
        <div class="bike-meta">${esc(moto.year || 'Por confirmar')}<br>${esc(moto.engine || 'Por confirmar')}</div>
        <div>${badgeFor(moto)}</div>
        <div class="row-actions">
          <button data-action="up" title="Subir posición"><i data-lucide="arrow-up"></i></button>
          <button data-action="down" title="Bajar posición"><i data-lucide="arrow-down"></i></button>
          ${moto.status !== 'vendida' ? '<button data-action="sold" title="Marcar vendida"><i data-lucide="badge-check"></i></button>' : ''}
          <button data-action="edit"><i data-lucide="pencil"></i>Editar</button>
        </div>
      </article>`).join('');
    refreshIcons();
  }

  function nextCode() {
    const highest = inventory.reduce((max, moto) => Math.max(max, Number(String(moto.code).replace(/\D/g, '')) || 0), 0);
    return `ABR-${String(highest + 1).padStart(3, '0')}`;
  }

  function defaultAvailability() {
    const name = fields.category.options[fields.category.selectedIndex]?.text || '';
    if (fields.status.value === 'vendida') return 'Esta moto ya encontró dueño';
    if (fields.status.value === 'apartada') return 'Apartada';
    if (name === 'En sucursal') return 'Disponible en sucursal';
    if (name.toLowerCase().includes('noviembre')) return 'Llega en noviembre';
    if (name === 'Próximamente') return 'Próximamente';
    return 'Disponibilidad por confirmar';
  }

  function openMotoDialog(moto = null) {
    currentMoto = moto;
    els.motoForm.reset();
    fields.id.value = moto?.id || '';
    fields.code.value = moto?.code || nextCode();
    fields.name.value = moto?.name || '';
    fields.brand.value = moto?.brand || '';
    fields.model.value = moto?.model || '';
    fields.year.value = moto?.year || 'Por confirmar';
    fields.price.value = moto?.price ?? '';
    fields.engine.value = moto?.engine || 'Por confirmar';
    fields.mileage.value = moto?.mileage || 'Por confirmar';
    fields.category.value = moto?.category_id || '';
    fields.status.value = moto?.status || 'disponible';
    fields.availability.value = moto?.availability_note || '';
    fields.order.value = moto?.sort_order ?? inventory.length + 1;
    fields.arrivalDate.value = moto?.arrival_date || '';
    fields.location.value = moto?.location || '';
    fields.visible.checked = moto ? Boolean(moto.visible) : true;
    fields.featured.checked = Boolean(moto?.featured);
    fields.transmission.value = moto?.transmission || 'Por confirmar';
    fields.fuel.value = moto?.fuel || 'Gasolina';
    fields.start.value = moto?.start_type || 'Eléctrico';
    fields.documentation.value = (moto?.documentation || []).join(', ');
    fields.description.value = moto?.description || '';
    els.motoImages.value = '';
    els.motoVideo.value = '';
    $('dialogEyebrow').textContent = moto ? moto.code : 'Nueva unidad';
    $('dialogTitle').textContent = moto ? 'Editar motocicleta' : 'Agregar motocicleta';
    els.deleteMotoButton.hidden = !moto;
    els.saveStatus.textContent = '';
    renderCurrentMedia();
    els.motoDialog.showModal();
    refreshIcons();
  }

  function renderCurrentMedia() {
    const media = currentMoto?.motorcycle_media || [];
    els.currentMedia.innerHTML = media.length ? media.map((item) => `
      <div class="media-item" data-media-id="${item.id}">
        ${item.media_type === 'video'
          ? `<video src="${esc(mediaUrl(item))}" muted></video>`
          : `<img src="${esc(mediaUrl(item))}" alt="">`}
        <span class="media-label">${item.is_primary ? 'Portada' : item.media_type === 'video' ? 'Video' : 'Foto'}</span>
        <button type="button" data-remove-media="${item.id}" title="Eliminar archivo"><i data-lucide="trash-2"></i></button>
      </div>`).join('') : '<p class="section-help">Todavía no hay archivos registrados.</p>';
    refreshIcons();
  }

  function formPayload() {
    const price = fields.price.value.trim();
    const sold = fields.status.value === 'vendida';
    return {
      code: fields.code.value.trim().toUpperCase(),
      name: fields.name.value.trim(),
      brand: fields.brand.value.trim() || null,
      model: fields.model.value.trim() || null,
      year: fields.year.value.trim() || 'Por confirmar',
      price: price === '' ? null : Number(price),
      currency: 'MXN',
      engine: fields.engine.value.trim() || 'Por confirmar',
      mileage: fields.mileage.value.trim() || 'Por confirmar',
      transmission: fields.transmission.value.trim() || 'Por confirmar',
      fuel: fields.fuel.value.trim() || 'Gasolina',
      start_type: fields.start.value.trim() || 'Eléctrico',
      category_id: sold ? null : (fields.category.value || null),
      status: fields.status.value,
      availability_note: fields.availability.value.trim() || defaultAvailability(),
      arrival_date: fields.arrivalDate.value || null,
      location: fields.location.value.trim() || null,
      description: fields.description.value.trim() || null,
      documentation: fields.documentation.value.split(',').map((item) => item.trim()).filter(Boolean),
      sort_order: Number(fields.order.value) || 0,
      visible: fields.visible.checked,
      featured: fields.featured.checked,
      updated_by: currentUser.id
    };
  }

  function safeFileName(name) {
    return name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9._-]+/g, '-').toLowerCase();
  }

  async function uploadFiles(moto) {
    const imageFiles = [...els.motoImages.files];
    const videoFiles = [...els.motoVideo.files];
    const files = [...imageFiles.map((file) => ({ file, type: 'image' })), ...videoFiles.map((file) => ({ file, type: 'video' }))];
    if (!files.length) return;
    if (files.some(({ file }) => file.size > 50 * 1024 * 1024)) throw new Error('Cada archivo debe pesar menos de 50 MB.');

    const existing = moto.motorcycle_media || [];
    let order = existing.reduce((max, item) => Math.max(max, item.sort_order || 0), 0) + 1;
    let needsPrimary = !existing.some((item) => item.media_type === 'image' && item.is_primary);
    for (const item of files) {
      const path = `${moto.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeFileName(item.file.name)}`;
      els.saveStatus.textContent = `Subiendo ${item.file.name}...`;
      const { error: uploadError } = await api.storage.from(config.bucket).upload(path, item.file, { cacheControl: '3600', upsert: false });
      if (uploadError) throw uploadError;
      const { data: publicData } = api.storage.from(config.bucket).getPublicUrl(path);
      const isPrimary = item.type === 'image' && needsPrimary;
      const { error: mediaError } = await api.from('motorcycle_media').insert({
        motorcycle_id: moto.id,
        media_type: item.type,
        url: publicData.publicUrl,
        storage_path: path,
        is_primary: isPrimary,
        sort_order: order++
      });
      if (mediaError) throw mediaError;
      if (isPrimary) needsPrimary = false;
    }
  }

  async function saveMoto(event) {
    event.preventDefault();
    els.saveMotoButton.disabled = true;
    els.saveStatus.textContent = 'Guardando información...';
    try {
      const payload = formPayload();
      if (payload.status !== 'vendida' && !payload.category_id) {
        throw new Error('Selecciona una categoría para la motocicleta.');
      }
      let result;
      if (currentMoto) {
        result = await api.from('motorcycles').update(payload).eq('id', currentMoto.id).select().single();
      } else {
        result = await api.from('motorcycles').insert({ ...payload, created_by: currentUser.id }).select().single();
      }
      if (result.error) throw result.error;
      const savedMoto = { ...result.data, motorcycle_media: currentMoto?.motorcycle_media || [] };
      await uploadFiles(savedMoto);
      els.motoDialog.close();
      showToast(currentMoto ? 'Motocicleta actualizada.' : 'Motocicleta agregada.');
      await loadInventory();
    } catch (error) {
      els.saveStatus.textContent = error.message;
      showToast(error.message, 'error');
    } finally {
      els.saveMotoButton.disabled = false;
    }
  }

  async function removeMedia(mediaId) {
    const item = currentMoto?.motorcycle_media.find((media) => media.id === mediaId);
    if (!item || !confirm('¿Eliminar este archivo del catálogo?')) return;
    try {
      const { error } = await api.from('motorcycle_media').delete().eq('id', item.id);
      if (error) throw error;
      if (item.storage_path) await api.storage.from(config.bucket).remove([item.storage_path]);
      currentMoto.motorcycle_media = currentMoto.motorcycle_media.filter((media) => media.id !== item.id);
      if (item.is_primary) {
        const next = currentMoto.motorcycle_media.find((media) => media.media_type === 'image');
        if (next) {
          const { error: primaryError } = await api.from('motorcycle_media').update({ is_primary: true }).eq('id', next.id);
          if (primaryError) throw primaryError;
          next.is_primary = true;
        }
      }
      renderCurrentMedia();
      showToast('Archivo eliminado.');
    } catch (error) {
      showToast(error.message, 'error');
    }
  }

  async function deleteMoto() {
    if (!currentMoto || !confirm(`¿Quitar ${currentMoto.name} del catálogo? Podrás conservar el registro en la base de datos.`)) return;
    els.deleteMotoButton.disabled = true;
    const { error } = await api.from('motorcycles').update({
      deleted_at: new Date().toISOString(), visible: false, updated_by: currentUser.id
    }).eq('id', currentMoto.id);
    els.deleteMotoButton.disabled = false;
    if (error) return showToast(error.message, 'error');
    els.motoDialog.close();
    showToast('Motocicleta retirada del catálogo.');
    await loadInventory();
  }

  async function markSold(moto) {
    if (!confirm(`¿Marcar ${moto.name} como vendida?`)) return;
    const { error } = await api.from('motorcycles').update({
      status: 'vendida', category_id: null, availability_note: 'Esta moto ya encontró dueño', updated_by: currentUser.id
    }).eq('id', moto.id);
    if (error) return showToast(error.message, 'error');
    showToast('La motocicleta pasó a Vendidas.');
    await loadInventory();
  }

  async function moveMoto(moto, direction) {
    const group = moto.status === 'vendida' ? 'vendida' : (moto.category_id || 'sin-categoria');
    const ordered = inventory
      .filter((item) => (item.status === 'vendida' ? 'vendida' : (item.category_id || 'sin-categoria')) === group)
      .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
    const index = ordered.findIndex((item) => item.id === moto.id);
    const target = ordered[index + direction];
    if (!target) return;
    const motoOrder = moto.sort_order || index + 1;
    const targetOrder = target.sort_order || index + direction + 1;
    const [first, second] = await Promise.all([
      api.from('motorcycles').update({ sort_order: targetOrder, updated_by: currentUser.id }).eq('id', moto.id),
      api.from('motorcycles').update({ sort_order: motoOrder, updated_by: currentUser.id }).eq('id', target.id)
    ]);
    if (first.error || second.error) return showToast((first.error || second.error).message, 'error');
    await loadInventory();
  }

  els.loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    els.loginButton.disabled = true;
    els.loginMessage.textContent = '';
    const { data, error } = await api.auth.signInWithPassword({
      email: els.loginEmail.value.trim(), password: els.loginPassword.value
    });
    try {
      if (error) throw error;
      await enterApp(data.session);
    } catch (loginError) {
      await api.auth.signOut();
      els.loginMessage.textContent = loginError.message === 'Invalid login credentials'
        ? 'Correo o contraseña incorrectos.' : loginError.message;
    } finally {
      els.loginButton.disabled = false;
    }
  });

  els.togglePassword.addEventListener('click', () => {
    const visible = els.loginPassword.type === 'text';
    els.loginPassword.type = visible ? 'password' : 'text';
    els.togglePassword.setAttribute('aria-label', visible ? 'Mostrar contraseña' : 'Ocultar contraseña');
    els.togglePassword.innerHTML = `<i data-lucide="${visible ? 'eye' : 'eye-off'}"></i>`;
    refreshIcons();
  });
  els.logoutButton.addEventListener('click', async () => { await api.auth.signOut(); leaveApp(); });
  els.newMotoButton.addEventListener('click', () => openMotoDialog());
  els.closeDialogButton.addEventListener('click', () => els.motoDialog.close());
  els.cancelDialogButton.addEventListener('click', () => els.motoDialog.close());
  els.deleteMotoButton.addEventListener('click', deleteMoto);
  els.motoForm.addEventListener('submit', saveMoto);
  els.adminSearch.addEventListener('input', renderInventory);
  els.adminFilter.addEventListener('change', renderInventory);
  els.refreshButton.addEventListener('click', () => Promise.all([loadCategories(), loadInventory()]));
  fields.category.addEventListener('change', () => { if (!fields.availability.value.trim()) fields.availability.value = defaultAvailability(); });
  fields.status.addEventListener('change', () => { fields.availability.value = defaultAvailability(); });
  els.currentMedia.addEventListener('click', (event) => {
    const button = event.target.closest('[data-remove-media]');
    if (button) removeMedia(button.dataset.removeMedia);
  });
  els.inventoryList.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-action]');
    const row = event.target.closest('[data-id]');
    if (!button || !row) return;
    const moto = inventory.find((item) => item.id === row.dataset.id);
    if (!moto) return;
    if (button.dataset.action === 'edit') openMotoDialog(moto);
    if (button.dataset.action === 'sold') markSold(moto);
    if (button.dataset.action === 'up') moveMoto(moto, -1);
    if (button.dataset.action === 'down') moveMoto(moto, 1);
  });

  boot();
})();
