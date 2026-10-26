(function () {
  'use strict';

  function $(sel) { return document.querySelector(sel); }
  function $$(sel) { return document.querySelectorAll(sel); }

  var token = sessionStorage.getItem('imyenda_token');
  var email = sessionStorage.getItem('imyenda_email');

  if (!token) {
    window.location.href = '/signin';
    return;
  }

  $('#adminEmail').textContent = email || '';

  function authHeaders() {
    return {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token,
    };
  }

  function escapeHtml(str) {
    if (!str) return '';
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function formatDate(dateStr) {
    var d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
      ' · ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  }

  function initials(name) {
    if (!name) return '?';
    var parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return parts[0].slice(0, 2).toUpperCase();
  }

  /* ---------- Tab switching ---------- */
  var tabInventory = $('#tabInventory');
  var tabContacts = $('#tabContacts');
  var panelInventory = $('#panelInventory');
  var panelContacts = $('#panelContacts');

  tabInventory.addEventListener('click', function () {
    tabInventory.classList.add('active');
    tabContacts.classList.remove('active');
    panelInventory.classList.add('active');
    panelContacts.classList.remove('active');
  });

  tabContacts.addEventListener('click', function () {
    tabContacts.classList.add('active');
    tabInventory.classList.remove('active');
    panelContacts.classList.add('active');
    panelInventory.classList.remove('active');
  });

  /* ---------- Logout ---------- */
  $('#logoutBtn').addEventListener('click', function () {
    sessionStorage.removeItem('imyenda_token');
    sessionStorage.removeItem('imyenda_email');
    window.location.href = '/signin';
  });

  /* ---------- Inventory ---------- */
  var inventoryData = [];

  function fetchInventory() {
    $('#inventoryTable').innerHTML = '<div class="admin-loading"><span class="spinner"></span></div>';
    fetch('/api/admin/inventory', { headers: authHeaders() })
      .then(function (res) {
        if (res.status === 401) { window.location.href = '/signin'; throw new Error('auth'); }
        return res.json();
      })
      .then(function (data) {
        if (data.error) {
          $('#inventoryTable').innerHTML = '<div class="admin-empty"><p>' + escapeHtml(data.error) + '</p></div>';
          return;
        }
        inventoryData = data;
        renderInventoryTable();
      })
      .catch(function (e) { if (e.message !== 'auth') $('#inventoryTable').innerHTML = '<div class="admin-empty"><p>Failed to load inventory.</p></div>'; });
  }

  function renderInventoryTable() {
    if (inventoryData.length === 0) {
      $('#inventoryTable').innerHTML = '<div class="admin-empty"><p>No items yet. Click "Add Item" to create your first one.</p></div>';
      return;
    }

    var html = '<table class="admin-table"><thead><tr>' +
      '<th></th><th>Name</th><th>Category</th><th>Size</th><th>Price</th><th>Status</th><th>Actions</th>' +
      '</tr></thead><tbody>';

    inventoryData.forEach(function (item) {
      var statusClass = item.status === 'Sold' ? 'sold' : 'available';
      var priceText = item.price ? Number(item.price).toLocaleString() + ' RWF' : '—';
      html += '<tr>' +
        '<td><img class="admin-table-img" src="' + escapeHtml(item.image_url) + '" alt="" /></td>' +
        '<td style="font-weight:600;color:var(--ink-900)">' + escapeHtml(item.name) + '</td>' +
        '<td>' + escapeHtml(item.category) + '</td>' +
        '<td>' + (item.size ? escapeHtml(item.size) : '—') + '</td>' +
        '<td>' + priceText + '</td>' +
        '<td><span class="admin-table-status ' + statusClass + '">' + escapeHtml(item.status) + '</span></td>' +
        '<td><div class="admin-table-actions">' +
          '<button class="admin-action-btn" data-edit="' + item.id + '" aria-label="Edit"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>' +
          '<button class="admin-action-btn delete" data-delete="' + item.id + '" aria-label="Delete"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>' +
        '</div></td>' +
      '</tr>';
    });

    html += '</tbody></table>';
    $('#inventoryTable').innerHTML = html;

    $$('[data-edit]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = btn.getAttribute('data-edit');
        var item = inventoryData.find(function (i) { return i.id === id; });
        if (item) openItemModal(item);
      });
    });

    $$('[data-delete]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = btn.getAttribute('data-delete');
        deleteItem(id);
      });
    });
  }

  function deleteItem(id) {
    if (!confirm('Are you sure you want to delete this item? This cannot be undone.')) return;
    fetch('/api/admin/inventory/' + id, {
      method: 'DELETE',
      headers: authHeaders(),
    })
      .then(function (res) { return res.json(); })
      .then(function (data) {
        if (data.success) fetchInventory();
      })
      .catch(function () {});
  }

  /* ---------- Item modal (add/edit) ---------- */
  var modalContainer = $('#modalContainer');
  var editingId = null;

  function openItemModal(item) {
    editingId = item ? item.id : null;
    var title = item ? 'Edit Item' : 'Add New Item';
    var btn = item ? 'Save Changes' : 'Create Item';

    var v = item || {};
    modalContainer.innerHTML =
      '<div class="admin-modal-overlay" id="itemModalOverlay">' +
        '<div class="admin-modal">' +
          '<div class="admin-modal-header">' +
            '<h2 class="admin-modal-title">' + title + '</h2>' +
            '<button class="admin-modal-close" id="itemModalClose"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>' +
          '</div>' +
          '<div id="itemFormAlert"></div>' +
          '<div class="form-group">' +
            '<label class="form-label">Name *</label>' +
            '<input type="text" class="form-input" id="itemName" value="' + escapeHtml(v.name || '') + '" placeholder="Imyenda Dress — Sunrise" />' +
          '</div>' +
          '<div class="admin-form-row">' +
            '<div class="form-group"><label class="form-label">Category *</label>' +
              '<select class="form-input" id="itemCategory">' +
                ['Dresses','Tops','Accessories'].map(function (c) {
                  return '<option value="' + c + '"' + (v.category === c ? ' selected' : '') + '>' + c + '</option>';
                }).join('') +
              '</select>' +
            '</div>' +
            '<div class="form-group"><label class="form-label">Size</label>' +
              '<input type="text" class="form-input" id="itemSize" value="' + escapeHtml(v.size || '') + '" placeholder="M" />' +
            '</div>' +
          '</div>' +
          '<div class="admin-form-row">' +
            '<div class="form-group"><label class="form-label">Price (RWF)</label>' +
              '<input type="number" class="form-input" id="itemPrice" value="' + (v.price || '') + '" placeholder="12000" />' +
            '</div>' +
            '<div class="form-group"><label class="form-label">Status</label>' +
              '<select class="form-input" id="itemStatus">' +
                '<option value="Available"' + (v.status !== 'Sold' ? ' selected' : '') + '>Available</option>' +
                '<option value="Sold"' + (v.status === 'Sold' ? ' selected' : '') + '>Sold</option>' +
              '</select>' +
            '</div>' +
          '</div>' +
          '<div class="form-group">' +
            '<label class="form-label">Image URL *</label>' +
            '<input type="url" class="form-input" id="itemImageUrl" value="' + escapeHtml(v.image_url || '') + '" placeholder="https://..." />' +
          '</div>' +
          '<div class="admin-form-preview" id="imgPreview"></div>' +
          '<div class="form-group">' +
            '<label class="form-label">Description</label>' +
            '<textarea class="form-textarea" id="itemDescription" style="min-height:80px" placeholder="Hand-tailored dress in vibrant patterns...">' + escapeHtml(v.description || '') + '</textarea>' +
          '</div>' +
          '<div class="admin-modal-actions">' +
            '<button class="admin-btn admin-btn-secondary" id="itemCancel">Cancel</button>' +
            '<button class="admin-btn admin-btn-primary" id="itemSave">' + btn + '</button>' +
          '</div>' +
        '</div>' +
      '</div>';

    updateImgPreview();

    $('#itemImageUrl').addEventListener('input', updateImgPreview);

    $('#itemModalClose').addEventListener('click', closeModal);
    $('#itemCancel').addEventListener('click', closeModal);
    $('#itemModalOverlay').addEventListener('click', function (e) {
      if (e.target === $('#itemModalOverlay')) closeModal();
    });

    $('#itemSave').addEventListener('click', saveItem);
  }

  function updateImgPreview() {
    var url = $('#itemImageUrl').value.trim();
    var preview = $('#imgPreview');
    if (url) {
      preview.innerHTML = '<img class="admin-form-preview-img" src="' + escapeHtml(url) + '" alt="Preview" />';
    } else {
      preview.innerHTML = '<div class="admin-form-preview-empty">Image preview will appear here</div>';
    }
  }

  function closeModal() {
    modalContainer.innerHTML = '';
    editingId = null;
  }

  function saveItem() {
    var name = $('#itemName').value.trim();
    var category = $('#itemCategory').value;
    var size = $('#itemSize').value.trim();
    var price = $('#itemPrice').value;
    var status = $('#itemStatus').value;
    var image_url = $('#itemImageUrl').value.trim();
    var description = $('#itemDescription').value.trim();

    var alertEl = $('#itemFormAlert');
    alertEl.innerHTML = '';

    if (!name || !category || !image_url) {
      alertEl.innerHTML = '<div class="form-alert form-alert-error"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg><p>Name, category, and image URL are required.</p></div>';
      return;
    }

    var body = { name: name, category: category, size: size || null, price: price ? Number(price) : null, status: status, image_url: image_url, description: description || null };
    var saveBtn = $('#itemSave');
    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving...';

    var url, method;
    if (editingId) {
      url = '/api/admin/inventory/' + editingId;
      method = 'PUT';
    } else {
      url = '/api/admin/inventory';
      method = 'POST';
    }

    fetch(url, { method: method, headers: authHeaders(), body: JSON.stringify(body) })
      .then(function (res) {
        if (res.status === 401) { window.location.href = '/signin'; throw new Error('auth'); }
        return res.json();
      })
      .then(function (data) {
        if (data.error) {
          alertEl.innerHTML = '<div class="form-alert form-alert-error"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg><p>' + escapeHtml(data.error) + '</p></div>';
          saveBtn.disabled = false;
          saveBtn.textContent = editingId ? 'Save Changes' : 'Create Item';
          return;
        }
        closeModal();
        fetchInventory();
      })
      .catch(function (e) {
        if (e.message !== 'auth') {
          saveBtn.disabled = false;
          saveBtn.textContent = editingId ? 'Save Changes' : 'Create Item';
        }
      });
  }

  $('#addBtn').addEventListener('click', function () { openItemModal(null); });

  /* ---------- Contacts ---------- */
  function fetchContacts() {
    $('#contactsList').innerHTML = '<div class="admin-loading"><span class="spinner"></span></div>';
    fetch('/api/admin/contacts', { headers: authHeaders() })
      .then(function (res) {
        if (res.status === 401) { window.location.href = '/signin'; throw new Error('auth'); }
        return res.json();
      })
      .then(function (data) {
        if (data.error) {
          $('#contactsList').innerHTML = '<div class="admin-empty"><p>' + escapeHtml(data.error) + '</p></div>';
          return;
        }
        renderContacts(data);
      })
      .catch(function (e) { if (e.message !== 'auth') $('#contactsList').innerHTML = '<div class="admin-empty"><p>Failed to load messages.</p></div>'; });
  }

  function renderContacts(contacts) {
    var badge = $('#contactsBadge');
    if (contacts.length > 0) {
      badge.textContent = contacts.length;
      badge.style.display = 'inline-block';
    } else {
      badge.style.display = 'none';
    }

    if (contacts.length === 0) {
      $('#contactsList').innerHTML = '<div class="admin-empty"><p>No messages yet.</p></div>';
      return;
    }

    var html = '';
    contacts.forEach(function (c) {
      html += '<div class="contact-card">' +
        '<div>' +
          '<div class="contact-card-header">' +
            '<div class="contact-card-avatar">' + initials(c.name) + '</div>' +
            '<div>' +
              '<div class="contact-card-name">' + escapeHtml(c.name) + '</div>' +
              '<div class="contact-card-email">' + escapeHtml(c.email) + '</div>' +
              (c.item_name ? '<div class="contact-card-item">Re: ' + escapeHtml(c.item_name) + '</div>' : '') +
            '</div>' +
          '</div>' +
          '<p class="contact-card-message">' + escapeHtml(c.message) + '</p>' +
        '</div>' +
        '<div style="display:flex;flex-direction:column;align-items:flex-end;gap:0.5rem">' +
          '<span class="contact-card-date">' + formatDate(c.created_at) + '</span>' +
          '<a href="mailto:' + escapeHtml(c.email) + '" class="admin-action-btn" style="text-decoration:none;color:inherit" aria-label="Reply">' +
            '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 17 4 12 9 7"/><path d="M20 18v-2a4 4 0 0 0-4-4H4"/></svg>' +
          '</a>' +
          '<button class="admin-action-btn delete" data-delete-contact="' + c.id + '" aria-label="Delete"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>' +
        '</div>' +
      '</div>';
    });

    $('#contactsList').innerHTML = html;

    $$('[data-delete-contact]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = btn.getAttribute('data-delete-contact');
        deleteContact(id);
      });
    });
  }

  function deleteContact(id) {
    if (!confirm('Delete this message?')) return;
    fetch('/api/admin/contacts/' + id, {
      method: 'DELETE',
      headers: authHeaders(),
    })
      .then(function (res) { return res.json(); })
      .then(function (data) {
        if (data.success) fetchContacts();
      })
      .catch(function () {});
  }

  /* ---------- Init ---------- */
  fetchInventory();
  fetchContacts();

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeModal();
  });
})();
