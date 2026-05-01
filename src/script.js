// Variáveis de controle
let dadosGlobais = [];
let intervaloSlideshow = null;
let indiceAbaAtual = 0;
let velSlide = 5000;
const nomesAbas = ['geral', 'decadas', 'top10', 'interativo'];

// Instâncias dos gráficos interativos
let instanciaMensal = null;
let instanciaRanking = null;
let instanciaSazonal = null;

// Carregamento de dados
async function carregarDados() {
    try {
        const resposta = await fetch('./src/data/GLB.Ts+dSST.csv');
        const textoCsv = await resposta.text();

        Papa.parse(textoCsv, {
            header: true,
            skipEmptyLines: true,
            complete: function (results) {
                dadosGlobais = results.data;

                processarGraficoGeral(dadosGlobais);
                const dadosDecadas = calcularMediasPorDecada(dadosGlobais);
                gerarGraficoDecadas(dadosDecadas.labelsDecadas, dadosDecadas.valoresDecadas);
                calcularTop10(dadosGlobais);

                preencherSeletorAnos(dadosGlobais);
            }
        });
    } catch (erro) {
        console.error("Erro ao carregar o CSV:", erro);
    }
}

//Lógica Dashboard Interativo
function preencherSeletorAnos(dados) {
    const seletor = document.getElementById('selecionarAno');

    if (!seletor) {
        console.error("ERRO: O elemento 'selecionarAno' não foi encontrado no HTML.");
        return;
    }

    const anosValidos = dados
        .filter(d => d.Year && !isNaN(d.Year))
        .map(d => d.Year)
        .reverse();

    seletor.innerHTML = "";

    anosValidos.forEach(ano => {
        const option = document.createElement('option');
        option.value = ano;
        option.text = ano;
        seletor.appendChild(option);
    });

    seletor.addEventListener('change', (e) => {
        atualizarDashboardTotal(e.target.value);
    });

    // Inicia com o ano mais recente
    atualizarDashboardTotal(anosValidos[0]);
}

function atualizarDashboardTotal(anoSelecionado) {
    const dadosAno = dadosGlobais.find(d => d.Year == anoSelecionado);
    if (!dadosAno) return;

    const mesesCSV = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const mesesPT = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    const valoresMeses = mesesCSV.map(m => parseFloat(dadosAno[m]));

    // Destruir instâncias anteriores
    if (instanciaMensal) instanciaMensal.destroy();
    if (instanciaRanking) instanciaRanking.destroy();
    if (instanciaSazonal) instanciaSazonal.destroy();

    //Gráfico de Linha
    const elM = document.getElementById('chartMensal');
    if (elM) {
        instanciaMensal = new Chart(elM.getContext('2d'), {
            type: 'line',
            data: {
                labels: mesesPT,
                datasets: [{
                    label: `Variação em ${anoSelecionado}`,
                    data: valoresMeses,
                    borderColor: '#2563eb',
                    tension: 0.4,
                    fill: false
                }]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });
    }

    //Gráfico Comparativo
    const elR = document.getElementById('chartRanking');
    const mediaDesteAno = parseFloat(calcularMediaLinha(dadosAno));
    if (elR) {
        instanciaRanking = new Chart(elR.getContext('2d'), {
            type: 'bar',
            data: {
                labels: ['Média Global', 'Ano Atual'],
                datasets: [{
                    label: 'Anomalia (°C)',
                    data: [0.70, mediaDesteAno],
                    backgroundColor: ['#94a3b8', '#ef4444']
                }]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });
    }

    //Gráfico Radar
    const elS = document.getElementById('chartSazonal');
    if (elS) {
        instanciaSazonal = new Chart(elS.getContext('2d'), {
            type: 'radar',
            data: {
                labels: mesesPT,
                datasets: [{
                    label: 'Perfil Sazonal',
                    data: valoresMeses,
                    backgroundColor: 'rgba(239, 68, 68, 0.2)',
                    borderColor: '#ef4444'
                }]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });
    }

    // Atualiza Card de Texto
    const labelMedia = document.getElementById('labelMediaAnual');
    if (labelMedia) labelMedia.innerText = mediaDesteAno + "°C";
}

//Função de processamento gráfico geral
function processarGraficoGeral(dados) {
    const anos = [];
    const medias = [];
    dados.forEach(linha => {
        const ano = linha['Year'];
        if (ano && !isNaN(ano)) {
            anos.push(ano);
            medias.push(calcularMediaLinha(linha));
        }
    });
    const ctx = document.getElementById('graficoGeral');
    if (ctx) {
        new Chart(ctx.getContext('2d'), {
            type: 'line',
            data: {
                labels: anos,
                datasets: [{
                    label: 'Anomalia Global (°C)',
                    data: medias,
                    borderColor: '#3b82f6',
                    fill: true,
                    tension: 0.3
                }]
            }
        });
    }
}

//Função de processamento gráfico décadas
function calcularMediasPorDecada(dadosBrutos) {
    const decadasAgrupadas = {};
    dadosBrutos.forEach(linha => {
        const ano = parseInt(linha['Year']);
        if (ano && !isNaN(ano)) {
            const decada = Math.floor(ano / 10) * 10;
            const mediaAnual = parseFloat(calcularMediaLinha(linha));
            if (!decadasAgrupadas[decada]) decadasAgrupadas[decada] = { soma: 0, qtd: 0 };
            decadasAgrupadas[decada].soma += mediaAnual;
            decadasAgrupadas[decada].qtd += 1;
        }
    });
    const labelsDecadas = Object.keys(decadasAgrupadas);
    const valoresDecadas = labelsDecadas.map(d => (decadasAgrupadas[d].soma / decadasAgrupadas[d].qtd).toFixed(2));
    return { labelsDecadas, valoresDecadas };
}

function gerarGraficoDecadas(labels, data) {
    const ctx = document.getElementById('graficoDecadas');
    if (ctx) {
        new Chart(ctx.getContext('2d'), {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{ label: 'Média por Década (°C)', data: data, backgroundColor: '#0ea5e9' }]
            }
        });
    }
}

//Função de processamento gráfico ranking
function calcularTop10(dados) {
    const listaParaRanking = dados.map(linha => ({
        ano: linha.Year,
        media: parseFloat(calcularMediaLinha(linha))
    })).filter(d => d.ano && !isNaN(d.media));
    const top10 = listaParaRanking.sort((a, b) => b.media - a.media).slice(0, 10);
    gerarGraficoTop10(top10.map(d => d.ano), top10.map(d => d.media));
}

function gerarGraficoTop10(labels, data) {
    const ctx = document.getElementById('graficoTop10');
    if (ctx) {
        new Chart(ctx.getContext('2d'), {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{ label: 'Ranking Maiores Anomalias (°C)', data: data, backgroundColor: '#f87171' }]
            },
            options: { indexAxis: 'y' }
        });
    }
}

//Funçẽos Helpers
function calcularMediaLinha(linha) {
    const meses = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    let soma = 0, cont = 0;
    meses.forEach(m => {
        const v = parseFloat(linha[m]);
        if (!isNaN(v)) { soma += v; cont++; }
    });
    return cont > 0 ? (soma / cont).toFixed(2) : 0;
}

function mudarAba(idAba) {
    document.querySelectorAll('.aba-conteudo').forEach(aba => aba.classList.add('hidden'));
    const elemento = document.getElementById('sessao-' + idAba);
    if (elemento) {
        elemento.classList.remove('hidden');
        if (idAba === 'interativo') {
            // O setTimeout garante que o navegador já processou o "remove('hidden')"
            setTimeout(() => {
                const anoAtual = document.getElementById('selecionarAno').value;
                atualizarDashboardTotal(anoAtual);
            }, 50); // 50ms é imperceptível, mas resolve o bug do tamanho
        }
    }

}

function atualizarDestaqueBotao(idAba) {
    const botoes = document.querySelectorAll('#menu-navegacao button[data-aba]');
    botoes.forEach(btn => {
        btn.classList.toggle('font-bold', btn.getAttribute('data-aba') === idAba);
        btn.classList.toggle('text-sky-300', btn.getAttribute('data-aba') === idAba);
    });
}

function alternarSlideshow() {
    const icon = document.getElementById('statusIcon');
    if (intervaloSlideshow) {
        clearInterval(intervaloSlideshow);
        intervaloSlideshow = null;
        if (icon) icon.innerText = "▶";
    } else {
        if (icon) icon.innerText = "Auto";
        intervaloSlideshow = setInterval(() => {
            indiceAbaAtual = (indiceAbaAtual + 1) % nomesAbas.length;
            const proxima = nomesAbas[indiceAbaAtual];
            mudarAba(proxima);
            atualizarDestaqueBotao(proxima);
        }, velSlide);
    }
}

function configurarNavegacao() {
    document.querySelectorAll('#menu-navegacao button[data-aba]').forEach(btn => {
        btn.addEventListener('click', () => {
            const aba = btn.getAttribute('data-aba');
            if (intervaloSlideshow) alternarSlideshow();
            mudarAba(aba);
            atualizarDestaqueBotao(aba);
            indiceAbaAtual = nomesAbas.indexOf(aba);
        });
    });
    const btnAuto = document.getElementById('btnAutoPlay');
    if (btnAuto) btnAuto.addEventListener('click', alternarSlideshow);
}

configurarNavegacao();
carregarDados();