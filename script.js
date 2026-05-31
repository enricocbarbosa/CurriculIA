const N8N_WEBHOOK_URL = "https://enricocardosobarbosa.app.n8n.cloud/webhook/curriculia-text";
const N8N_WEBHOOK_PDF_URL = "https://enricocardosobarbosa.app.n8n.cloud/webhook/curriculia-pdf"

let currentTab = "text";
let generatedCurriculum = "";

document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentTab = btn.dataset.tab;
        document.querySelectorAll('.form-content').forEach(content => content.classList.remove('active'));
        document.getElementById(`tab-${currentTab}`).classList.add('active');
    });
});

document.getElementById('btnGenerate').addEventListener('click', async () => {
    const btn = document.getElementById('btnGenerate');
    btn.disabled = true;
    btn.innerHTML = '<span class="loading-spinner"></span> Gerando...';

    try {
        if (currentTab === 'pdf') {
            const fileInput = document.getElementById('pdfInput');
            if (!fileInput || !fileInput.files[0]) {
                showToast('Por favor, selecione um arquivo PDF', 'error');
                btn.disabled = false;
                btn.innerHTML = '<i class="fas fa-sparkles"></i> Gerar meu currículo com IA';
                return;
            }

            const base64 = await new Promise((resolve) => {
                const reader = new FileReader();
                reader.onload = (e) => resolve(e.target.result.split(',')[1]);
                reader.readAsDataURL(fileInput.files[0]);
            });

            try {
                const response = await fetch(N8N_WEBHOOK_PDF_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ pdfBase64: base64 })
                });
                if (!response.ok) throw new Error('Erro no servidor');
                const blob = await response.blob();
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'curriculo_gerado.pdf';
                a.click();
                URL.revokeObjectURL(url);
                showToast('Currículo gerado com sucesso!', 'success');
            } catch (error) {
                showToast('Erro ao gerar currículo', 'error');
            } finally {
                btn.disabled = false;
                btn.innerHTML = '<i class="fas fa-sparkles"></i> Gerar meu currículo com IA';
            }
            return;
        }

        if (currentTab === 'docx') {
            showToast('Função DOCX será implementada em breve', 'info');
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-sparkles"></i> Gerar meu currículo com IA';
            return;
        }

        const dados = {
            nome: document.getElementById('nome').value,
            email: document.getElementById('email').value,
            telefone: document.getElementById('telefone').value,
            area: document.getElementById('area').value,
            experiencias: document.getElementById('experiencias').value,
            formacao: document.getElementById('formacao').value,
            habilidades: document.getElementById('habilidades').value,
            idiomas: document.getElementById('idiomas').value
        };

        if (!dados.nome) {
            showToast('Por favor, preencha seu nome', 'error');
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-sparkles"></i> Gerar meu currículo com IA';
            return;
        }

        let curriculum;
        try {
            const response = await fetch(N8N_WEBHOOK_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dados)
            });
            if (response.ok) {
                const blob = await response.blob();
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'curriculo_gerado.pdf';
                a.click();
                URL.revokeObjectURL(url);
                showToast('Currículo gerado com sucesso!', 'success');
                return;
            } else {
                throw new Error('n8n não respondeu');
            }
        } catch (error) {
            curriculum = gerarCurriculoSimulado(dados);
            showToast('Modo demonstração - Conecte o n8n para usar IA real', 'warning');
            generatedCurriculum = curriculum;
            document.getElementById('curriculumResult').innerHTML = curriculum.replace(/\n/g, '<br>');
            document.getElementById('modal').classList.add('active');
        }

    } catch (error) {
        showToast('Erro ao gerar currículo', 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-sparkles"></i> Gerar meu currículo com IA';
    }
});


function showToast(message, type) {
    const toast = document.createElement('div');
    toast.style.cssText = `position:fixed;bottom:20px;right:20px;background:${type === 'error' ? '#ef4444' : type === 'success' ? '#22c55e' : type === 'warning' ? '#f59e0b' : '#3b82f6'};color:white;padding:12px 20px;border-radius:12px;z-index:9999;`;
    toast.innerHTML = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });

document.addEventListener('change', (e) => {
    if (e.target.id === 'pdfInput') {
        const fileName = e.target.files[0]?.name;
        document.getElementById('pdfFileName').textContent = fileName || '';
    }
});

const dropZone = document.querySelector('#tab-pdf label');

dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.style.borderColor = '#2563eb';
    dropZone.style.background = '#eff6ff';
});

dropZone.addEventListener('dragleave', () => {
    dropZone.style.borderColor = '#e2e8f0';
    dropZone.style.background = 'transparent';
});

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.style.borderColor = '#e2e8f0';
    dropZone.style.background = 'transparent';
    
    const file = e.dataTransfer.files[0];
    if (file && file.type === 'application/pdf') {
        const fileInput = document.getElementById('pdfInput');
        const dt = new DataTransfer();
        dt.items.add(file);
        fileInput.files = dt.files;
        document.getElementById('pdfFileName').textContent = file.name;
    } else {
        showToast('Por favor, solte apenas arquivos PDF', 'error');
    }
});