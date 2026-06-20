// public/js/admin.js

let currentPassword = "";

async function checkPassword() {
  const input = document.getElementById('adminPassword').value;
  
  // Test password dengan memanggil API
  try {
    const res = await fetch('/api/admin/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: input })
    });
    
    if (res.ok) {
      const data = await res.json();
      currentPassword = input;
      document.getElementById('loginOverlay').style.display = 'none';
      document.getElementById('dashboardArea').style.display = 'block';
      document.getElementById('loginError').style.display = 'none';
      renderTable(data.reports || []);
    } else {
      document.getElementById('loginError').style.display = 'block';
    }
  } catch(e) {
    alert("Gagal koneksi ke server");
  }
}

function logout() {
  document.getElementById('loginOverlay').style.display = 'flex';
  document.getElementById('dashboardArea').style.display = 'none';
  document.getElementById('adminPassword').value = '';
  currentPassword = "";
}

async function loadReports() {
  const tbody = document.getElementById('reportsBody');
  tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:40px;"><div style="color:var(--muted)">Memuat data...</div></td></tr>`;

  try {
    const res = await fetch('/api/admin/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: currentPassword })
    });
    
    if (res.ok) {
      const data = await res.json();
      renderTable(data.reports || []);
    } else {
      logout();
    }
  } catch (err) {
    console.error("Error loading reports:", err);
    tbody.innerHTML = `<tr><td colspan="5" class="empty-state" style="color:var(--red);">Gagal memuat data dari Server.</td></tr>`;
  }
}

function renderTable(reports) {
  const tbody = document.getElementById('reportsBody');
  if (reports.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="empty-state">Belum ada laporan bug.</td></tr>`;
    return;
  }

  let html = '';
  reports.forEach(data => {
    const id = data.id;
    let dateStr = '-';
    if (data.createdAt) {
      const d = new Date(data.createdAt);
      dateStr = d.toLocaleDateString('id-ID', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' });
    }

    const statusBadge = data.status === 'resolved' 
      ? `<span class="badge resolved">Selesai</span>` 
      : `<span class="badge pending">Menunggu</span>`;

    html += `
      <tr id="row-${id}">
        <td>${dateStr}</td>
        <td>${statusBadge}</td>
        <td class="link-cell"><a href="${data.url}" target="_blank" title="${data.url}">${data.url}</a></td>
        <td class="desc-cell">${data.description}</td>
        <td>
          <div class="actions">
            ${data.status !== 'resolved' ? `<button class="btn-action resolve" onclick="markResolved('${id}')">Tandai Selesai</button>` : ''}
            <button class="btn-action delete" onclick="deleteReport('${id}')">Hapus</button>
          </div>
        </td>
      </tr>
    `;
  });

  tbody.innerHTML = html;
}

async function markResolved(id) {
  if (!confirm('Tandai laporan ini sebagai selesai?')) return;
  
  try {
    const res = await fetch(`/api/admin/reports/resolve/${id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: currentPassword })
    });
    if(res.ok) {
      loadReports();
    } else {
      alert("Gagal update status");
    }
  } catch (err) {
    alert('Gagal mengupdate status: ' + err.message);
  }
}

async function deleteReport(id) {
  if (!confirm('Yakin ingin menghapus laporan ini permanen?')) return;
  
  try {
    const res = await fetch(`/api/admin/reports/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: currentPassword })
    });
    if(res.ok) {
      loadReports();
    } else {
      alert("Gagal menghapus");
    }
  } catch (err) {
    alert('Gagal menghapus laporan: ' + err.message);
  }
}
