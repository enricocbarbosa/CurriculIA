const N8N_WEBHOOK_TYPE_URL = "https://curriculia.app.n8n.cloud/webhook/curriculia-text";
const N8N_WEBHOOK_PDF_URL = "https://curriculia.app.n8n.cloud/webhook/curriculia-pdf"
const N8N_WEBHOOK_REVIEW_URL = "https://curriculia.app.n8n.cloud/webhook/curriculia-review";

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

        const dados = {
            nome: document.getElementById('nome').value,
            email: document.getElementById('email').value,
            telefone: document.getElementById('telefone').value,
            area: document.getElementById('area').value === 'outra' 
            ? document.getElementById('areaOutra').value 
            : document.getElementById('area').value,
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
            const response = await fetch(N8N_WEBHOOK_TYPE_URL, {
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

function typeText(elementId, text, delay = 0) {
    return new Promise(resolve => {
        setTimeout(() => {
            const el = document.getElementById(elementId);
            if (!el) return resolve();
            el.textContent = '';
            let i = 0;
            const interval = setInterval(() => {
                el.textContent += text[i];
                i++;
                if (i >= text.length) {
                    clearInterval(interval);
                    resolve();
                }
            }, 18);
        }, delay);
    });
}

async function runCardAnimation() {
    const footer = document.querySelector('.ai-card-footer');
    const ids = ['animName', 'animExp', 'animForm', 'animSkills'];
    ids.forEach(id => { const el = document.getElementById(id); if (el) el.textContent = ''; });
    if (footer) footer.classList.remove('visible');

    await typeText('animName', 'João Silva', 300);
    await typeText('animExp', 'Dev Front-end · Empresa X · 2022–2024', 200);
    await typeText('animForm', 'Ciência da Computação · Universidade ABC', 200);
    await typeText('animSkills', 'JavaScript · Python · React · Node.js', 200);

    setTimeout(() => { if (footer) footer.classList.add('visible'); }, 300);
    setTimeout(runCardAnimation, 4000);
}

runCardAnimation();

function toggleOutraArea(select) {
    const input = document.getElementById('areaOutra');
    input.style.display = select.value === 'outra' ? 'block' : 'none';
}

document.getElementById('btnReview').addEventListener('click', async () => {
    const btn = document.getElementById('btnReview');
    const fileInput = document.getElementById('pdfReview');

    if (!fileInput || !fileInput.files[0]) {
        showToast('Por favor, selecione um PDF para analisar', 'error');
        return;
    }

    btn.disabled = true;
    btn.innerHTML = '<span class="loading-spinner"></span> Analisando...';

    const base64 = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result.split(',')[1]);
        reader.readAsDataURL(fileInput.files[0]);
    });

    try {
        const response = await fetch(N8N_WEBHOOK_REVIEW_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pdfBase64: base64 })
        });

        if (!response.ok) throw new Error('Erro no servidor');

        const data = await response.json();

        // Pontos fortes
        document.getElementById('reviewFortes').innerHTML = data.pontos_fortes.map(p => `<li>${p}</li>`).join('');
        // Pontos a melhorar
        document.getElementById('reviewMelhorar').innerHTML = data.pontos_a_melhorar.map(p => `<li>${p}</li>`).join('');
        // Sugestões
        document.getElementById('reviewEstrutura').innerHTML = data.sugestoes_estrategicas.estrutura.map(p => `<li>${p}</li>`).join('');
        document.getElementById('reviewConteudo').innerHTML = data.sugestoes_estrategicas.conteudo.map(p => `<li>${p}</li>`).join('');
        document.getElementById('reviewPalavras').innerHTML = data.sugestoes_estrategicas.palavras_chave.map(p => `<li>${p}</li>`).join('');
        // ATS
        const nivel = data.compatibilidade_ats.nivel;
        const badgeClass = nivel === 'Alta' ? 'ats-alta' : nivel === 'Média' ? 'ats-media' : 'ats-baixa';
        document.getElementById('reviewAts').innerHTML = `
            <span class="ats-badge ${badgeClass}">${nivel}</span>
            <p style="font-size:0.875rem; color:#334155;">${data.compatibilidade_ats.justificativa}</p>
        `;

        document.getElementById('reviewResult').style.display = 'block';
        document.getElementById('reviewResult').scrollIntoView({ behavior: 'smooth' });

    } catch (error) {
        showToast('Erro ao analisar currículo', 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-magnifying-glass"></i> Analisar currículo com IA';
    }
});

document.addEventListener('change', (e) => {
    if (e.target.id === 'pdfReview') {
        const fileName = e.target.files[0]?.name;
        document.getElementById('reviewFileName').textContent = fileName || '';
    }
});