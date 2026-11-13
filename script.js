const imageInput = document.getElementById("imageInput");
const preview = document.getElementById("preview");

let hasilDeteksi = null;
let previewUrl = null;

imageInput.addEventListener("change", function () {
    const file = this.files[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
        alert("File harus berupa gambar!");
        this.value = "";
        return;
    }

    if (previewUrl) URL.revokeObjectURL(previewUrl);
    previewUrl = URL.createObjectURL(file);
    preview.src = previewUrl;
    preview.style.display = "block";
    document.getElementById("result").style.display = "none";
    hasilDeteksi = null;
});

function detectPapaya() {
    const nama = document.getElementById("nama").value.trim();
    const jenis = document.getElementById("jenis").value.trim();
    const warna = document.getElementById("warna").value;
    const kondisi = document.getElementById("kondisi").value;

    if (!nama || !jenis || !warna || !kondisi) {
        alert("Lengkapi nama, jenis pepaya, warna kulit, dan kondisi buah.");
        return;
    }

    if (!imageInput.files.length || !preview.naturalWidth) {
        alert("Upload foto pepaya terlebih dahulu!");
        return;
    }

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    canvas.width = 200;
    canvas.height = 200;

    const scale = Math.min(
        200 / preview.naturalWidth,
        200 / preview.naturalHeight
    );
    const width = preview.naturalWidth * scale;
    const height = preview.naturalHeight * scale;

    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, 200, 200);
    ctx.drawImage(
        preview,
        (200 - width) / 2,
        (200 - height) / 2,
        width,
        height
    );

    const pixels = ctx.getImageData(0, 0, 200, 200).data;
    let green = 0;
    let yellow = 0;
    let orange = 0;
    let total = 0;

    for (let i = 0; i < pixels.length; i += 16) {
        const r = pixels[i];
        const g = pixels[i + 1];
        const b = pixels[i + 2];
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);

        if (max < 45 || max === 0) continue;
        if ((max - min) / max < 0.16) continue;

        total++;

        if (g > r * 1.08 && g > b * 1.08) {
            green++;
        } else if (r > g * 1.12 && g > b * 1.05) {
            orange++;
        } else if (r > g * 1.02 && g > b * 1.08) {
            yellow++;
        }
    }

    if (total < 80) {
        alert("Foto kurang jelas. Silakan gunakan foto lain dengan pencahayaan lebih baik.");
        return;
    }

    const greenRatio = green / total;
    const ripeRatio = (yellow + orange) / total;
    let status;
    let description;

    if (ripeRatio >= 0.30 && greenRatio < 0.45) {
        status = "MATANG";
        description = "Pepaya diperkirakan sudah matang berdasarkan warna pada foto.";
    } else if (ripeRatio >= 0.12) {
        status = "SETENGAH MATANG";
        description = "Pepaya diperkirakan sedang dalam proses pematangan.";
    } else {
        status = "MENTAH";
        description = "Pepaya diperkirakan belum matang karena warna hijau lebih dominan.";
    }

    document.getElementById("status").textContent = status;
    document.getElementById("description").textContent = description;
    document.getElementById("result").style.display = "block";

    hasilDeteksi = {
        nama,
        jenis,
        warna,
        kondisi,
        status,
        description,
        catatan: document.getElementById("catatan").value.trim(),
        tanggal: new Date().toLocaleString("id-ID")
    };
}

function saveHistory() {
    if (!hasilDeteksi) {
        alert("Lakukan deteksi terlebih dahulu!");
        return;
    }

    const history = JSON.parse(localStorage.getItem("riwayatPepaya") || "[]");
    history.unshift(hasilDeteksi);
    localStorage.setItem("riwayatPepaya", JSON.stringify(history));

    alert("Hasil deteksi berhasil disimpan!");
    hasilDeteksi = null;
    showHistory();
}

function showHistory() {
    const history = JSON.parse(localStorage.getItem("riwayatPepaya") || "[]");
    const search = document.getElementById("search").value.toLowerCase();
    const container = document.getElementById("history");
    container.innerHTML = "";

    const filtered = history.filter(item =>
        item.nama.toLowerCase().includes(search) ||
        item.jenis.toLowerCase().includes(search) ||
        item.status.toLowerCase().includes(search)
    );

    if (filtered.length === 0) {
        const empty = document.createElement("p");
        empty.className = "empty-history";
        empty.textContent = "Belum ada riwayat deteksi yang cocok.";
        container.appendChild(empty);
        return;
    }

    filtered.forEach(item => {
        const card = document.createElement("div");
        card.className = "history-item";

        const title = document.createElement("strong");
        title.textContent = `${item.nama} - ${item.jenis}`;

        const details = document.createElement("p");
        details.textContent = `Hasil: ${item.status} | Warna: ${item.warna} | Kondisi: ${item.kondisi}`;

        const note = document.createElement("p");
        note.textContent = `Catatan: ${item.catatan || "-"}`;

        const date = document.createElement("small");
        date.textContent = `Tanggal: ${item.tanggal}`;

        const remove = document.createElement("button");
        remove.type = "button";
        remove.textContent = "Hapus";
        remove.addEventListener("click", () => deleteHistoryItem(item));

        card.append(title, details, note, date, document.createElement("br"), remove);
        container.appendChild(card);
    });
}

function deleteHistoryItem(itemToDelete) {
    const history = JSON.parse(localStorage.getItem("riwayatPepaya") || "[]");
    const index = history.indexOf(itemToDelete);

    if (index !== -1) {
        history.splice(index, 1);
        localStorage.setItem("riwayatPepaya", JSON.stringify(history));
    }

    showHistory();
}

document.getElementById("detectButton").addEventListener("click", detectPapaya);
document.getElementById("saveButton").addEventListener("click", saveHistory);
document.getElementById("search").addEventListener("input", showHistory);

showHistory();
