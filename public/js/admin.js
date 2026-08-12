const api = async (url, opts = {}) => {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...opts
  });
  if (res.status === 401) { location.href = 'login.html'; throw new Error('Unauthorized'); }
  if (!res.ok) throw new Error((await res.json()).error || 'Request failed');
  return res.json();
};

const { admin } = await api('/api/session');
if (!admin) location.href = 'login.html';

document.querySelectorAll('.tab').forEach(t => t.addEventListener('click', () => {
  document.querySelectorAll('.tab').forEach(x => x.classList.remove('on'));
  document.querySelectorAll('.tab-panel').forEach(x => x.classList.add('hidden'));
  t.classList.add('on');
  document.getElementById('tab-' + t.dataset.tab).classList.remove('hidden');
}));

const invBody = document.getElementById('inv-body');
const loadInv = async () => {
  const items = await api('/api/inventory');
  invBody.innerHTML = items.map(i => `
    <tr>
      <td>${i.name}</td>
      <td>${i.category}</td>
      <td>₹${Number(i.price).toFixed(0)}</td>
      <td><input type="number" min="0" value="${i.stock}" data-stock="${i.id}" class="stock-in" /></td>
      <td class="row-actions">
        <button class="btn sm save-stock" data-id="${i.id}">Save</button>
        <button class="btn sm danger del-item" data-id="${i.id}">Delete</button>
      </td>
    </tr>`).join('');
};
invBody.addEventListener('click', async (e) => {
  const id = e.target.dataset.id;
  if (!id) return;
  if (e.target.classList.contains('del-item')) {
    if (confirm('Delete this item?')) { await api(`/api/inventory/${id}`, { method: 'DELETE' }); loadInv(); }
  }
  if (e.target.classList.contains('save-stock')) {
    const stock = Number(document.querySelector(`[data-stock="${id}"]`).value || 0);
    const item = (await api('/api/inventory')).find(x => x.id == id);
    await api(`/api/inventory/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ ...item, stock })
    });
    loadInv();
  }
});
document.getElementById('add-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  await api('/api/inventory', {
    method: 'POST',
    body: JSON.stringify({
      name: document.getElementById('i-name').value,
      price: document.getElementById('i-price').value,
      category: document.getElementById('i-cat').value,
      stock: document.getElementById('i-stock').value
    })
  });
  e.target.reset();
  loadInv();
});

const logBody = document.getElementById('log-body');
const loadLogs = async () => {
  const logs = await api('/api/staff-logs');
  logBody.innerHTML = logs.map(l => `
    <tr>
      <td>${l.staff_name}</td>
      <td>${l.action}</td>
      <td>${l.note || '—'}</td>
      <td>${l.created_at}</td>
      <td><button class="btn sm danger del-log" data-id="${l.id}">Delete</button></td>
    </tr>`).join('') || '<tr><td colspan="5">No entries yet</td></tr>';
};
logBody.addEventListener('click', async (e) => {
  if (e.target.classList.contains('del-log')) {
    await api(`/api/staff-logs/${e.target.dataset.id}`, { method: 'DELETE' });
    loadLogs();
  }
});
document.getElementById('log-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  await api('/api/staff-logs', {
    method: 'POST',
    body: JSON.stringify({
      staff_name: document.getElementById('l-name').value,
      action: document.getElementById('l-action').value,
      note: document.getElementById('l-note').value
    })
  });
  e.target.reset();
  loadLogs();
});

document.getElementById('logout').addEventListener('click', async () => {
  await api('/api/logout', { method: 'POST' });
  location.href = 'login.html';
});

loadInv();
loadLogs();
