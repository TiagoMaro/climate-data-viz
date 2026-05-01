//Variáveis de controle
let dadosGlobais = [];
let graficoAnoInstance = null;
let intervaloSlideshow = null;
let indiceAbaAtual = 0;
let velSlide = 5000; //5 segundos
const nomesAbas = ['geral', 'decadas', 'top10', 'interativo'];

//Carregamento de dados
async function carregarDados() {
    try {
        const resposta = await fetch('./src/data/GLB.Ts+dSST.csv');
        const textoCsv = await resposta.text();

        Papa.parse(textoCsv, {
            header: true,
            skipEmptyLines: true,
            complete: function (results) {
                dadosGlobais = results.data;

                //Inicializa os 4 gráficos
                //Gráfico geral
                processarGraficoGeral(dadosGlobais);

                //Gráfico por décadas
                const dadosDecadas = calcularMediasPorDecada(dadosGlobais);
                gerarGraficoDecadas(dadosDecadas.labelsDecadas, dadosDecadas.valoresDecadas);

                //Gráfico TOP 10
                calcularTop10(dadosGlobais);

                //Gráfico Interativo
                preencherSeletorAnos(dadosGlobais);

            }
        });
    } catch (erro) {
        console.error("Erro ao carregar o CSV:", erro);
    }
}

//Gráfico geral
function processarGraficoGeral(dados) {
    const anos = [];
    const medias = [];

    dados.forEach(linha => {
        const ano = linha['Year'];
        if (ano && !isNaN(ano)) {
            anos.push(ano);
            const media = calcularMediaLinha(linha);
            medias.push(media);
        }
    });

    const ctx = document.getElementById('graficoGeral').getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: anos,
            datasets: [{
                label: 'Anomalia de Temperatura Global (°C)',
                data: medias,
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                fill: true,
                tension: 0.3
            }]
        }
    });
}

//Lógica matematica gráfico décadas
function calcularMediasPorDecada(dadosBrutos) {
    const decadasAgrupadas = {};

    dadosBrutos.forEach(linha => {
        const ano = parseInt(linha['Year']);
        if (ano && !isNaN(ano)) {
            const decada = Math.floor(ano / 10) * 10;
            const mediaAnual = parseFloat(calcularMediaLinha(linha));

            if (!decadasAgrupadas[decada]) {
                decadasAgrupadas[decada] = { soma: 0, qtd: 0 };
            }
            decadasAgrupadas[decada].soma += mediaAnual;
            decadasAgrupadas[decada].qtd += 1;
        }
    });

    const labelsDecadas = Object.keys(decadasAgrupadas);
    const valoresDecadas = labelsDecadas.map(d =>
        (decadasAgrupadas[d].soma / decadasAgrupadas[d].qtd).toFixed(2)
    );

    return { labelsDecadas, valoresDecadas };
}

//Gerar gráfico décadas
function gerarGraficoDecadas(labels, data) {
    const ctx = document.getElementById('graficoDecadas').getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Média por Década (°C)',
                data: data,
                backgroundColor: '#0ea5e9'
            }]
        }
    });
}

//Lógica gráfico interativo
function preencherSeletorAnos(dados) {
    const seletor = document.getElementById('selecionarAno');
    const anosValidos = dados
        .filter(d => d.Year && !isNaN(d.Year))
        .map(d => d.Year)
        .reverse();

    anosValidos.forEach(ano => {
        const option = document.createElement('option');
        option.value = ano;
        option.text = ano;
        seletor.appendChild(option);
    });

    seletor.addEventListener('change', atualizarGraficoAno);
    atualizarGraficoAno();
}

//Gerar gráfico interativo
function atualizarGraficoAno() {
    const anoSelecionado = document.getElementById('selecionarAno').value;
    const linhaAno = dadosGlobais.find(d => d.Year == anoSelecionado);

    const mesesLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const valoresMeses = mesesLabels.map(m => parseFloat(linhaAno[m]));

    const ctx = document.getElementById('graficoAnoIndividual').getContext('2d');

    if (graficoAnoInstance) graficoAnoInstance.destroy();

    graficoAnoInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: mesesLabels,
            datasets: [{
                label: `Variação Mensal em ${anoSelecionado}`,
                data: valoresMeses,
                backgroundColor: valoresMeses.map(v => v > 0 ? '#ef4444' : '#3b82f6')
            }]
        }
    });
}

//Lógica gráfico Top 10
function calcularTop10(dados) {
    const listaParaRanking = dados.map(linha => ({
        ano: linha.Year,
        media: parseFloat(calcularMediaLinha(linha))
    })).filter(d => d.ano && !isNaN(d.media));

    //Ordena do maior para o menor
    //Pega apenas os 10 primeiros
    const top10 = listaParaRanking
        .sort((a, b) => b.media - a.media)
        .slice(0, 10);

    const labels = top10.map(d => d.ano);
    const valores = top10.map(d => d.media);

    gerarGraficoTop10(labels, valores);
}

//Gerar gráfico TOP 10
function gerarGraficoTop10(labels, data) {
    const ctx = document.getElementById('graficoTop10').getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Ranking Maiores Anomalias',
                data: data,
                backgroundColor: '#f87171',
                borderRadius: 4
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            plugins: {
                legend: { display: false }
            }
        }
    });
}

//Funções Utilitárias (Helpers)
function calcularMediaLinha(linha) {
    const meses = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    let soma = 0;
    let cont = 0;
    meses.forEach(m => {
        const v = parseFloat(linha[m]);
        if (!isNaN(v)) {
            soma += v;
            cont++;
        }
    });
    return (soma / cont).toFixed(2);
}

//Mudar o gráfico conforme os botões na header
function mudarAba(idAba) {
    document.querySelectorAll('.aba-conteudo').forEach(aba => {
        aba.classList.add('hidden');
    });
    document.getElementById('sessao-' + idAba).classList.remove('hidden');
}

//Destaque visual dos botões
function atualizarDestaqueBotao(idAba) {
    const botoes = document.querySelectorAll('#menu-navegacao button[data-aba]');
    botoes.forEach(btn => {
        if (btn.getAttribute('data-aba') === idAba) {
            btn.classList.add('font-bold', 'underline', 'text-sky-300');
        } else {
            btn.classList.remove('font-bold', 'underline', 'text-sky-300');
        }
    });
}

//Alternar gráficos automático
function alternarSlideshow() {
    const btnAuto = document.getElementById('btnAutoPlay');
    const icon = document.getElementById('statusIcon');

    if (intervaloSlideshow) {
        clearInterval(intervaloSlideshow);
        intervaloSlideshow = null;
        
        btnAuto.classList.remove('bg-emerald-500');
        btnAuto.classList.add('ml-4', 'p-2', 'bg-blue-800', 'hover:bg-blue-700', 'text-white', 'rounded-full', 'transition-all', 'duration-300', 'shadow-inner', 'flex', 'items-center', 'justify-center', 'w-8', 'h-8', 'opacity-80', 'hover:opacity-100');
        icon.innerText = "▶";
        icon.classList.add('text-[10px]', 'uppercase');
    } else {
        btnAuto.classList.remove('bg-transparent', 'border', 'border-blue-400');
        btnAuto.classList.add('bg-blue-500');
        icon.innerText = "Auto";
        
        intervaloSlideshow = setInterval(() => {
            indiceAbaAtual = (indiceAbaAtual + 1) % nomesAbas.length;
            const proximaAba = nomesAbas[indiceAbaAtual];
            mudarAba(proximaAba);
            atualizarDestaqueBotao(proximaAba); 
        }, velSlide);
    }
}

//Controle de abas
function configurarNavegacao() {
    const botoes = document.querySelectorAll('#menu-navegacao button[data-aba]');
    const btnAuto = document.getElementById('btnAutoPlay');

    botoes.forEach(btn => {
        btn.addEventListener('click', () => {
            const abaAlvo = btn.getAttribute('data-aba');
            
            //Para o slideshow se clicar manualmente em algum gráfico
            if (intervaloSlideshow) alternarSlideshow();

            mudarAba(abaAlvo);
            atualizarDestaqueBotao(abaAlvo);
            indiceAbaAtual = nomesAbas.indexOf(abaAlvo);
        });
    });

    if (btnAuto) {
        btnAuto.addEventListener('click', alternarSlideshow);
    }
}

//Inicialização Geral
configurarNavegacao();
carregarDados();