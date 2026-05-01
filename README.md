# Climate Data Viz
    
[🔗 Acesse o projeto online aqui](https://tiagomaro.github.io/climate-data-viz/)
    
# Sobre o Projeto

O primeiro passo para o desenvolvimento do projeto foi o tratamento adequado dos dados contidos no arquivo GISTEMP v4 da NASA. Para isso, utilizei a biblioteca PapaParse, uma das principais ferramentas de JavaScript para o processamento eficiente de arquivos CSV. Para garantir a integridade das visualizações, realizei o tratamento de valores não numéricos, nulos ou caracteres especiais, evitando erros de renderização causados por má formatação dos dados originais.

Para a geração dos gráficos, utilizei a biblioteca Chart.js, que proporciona versatilidade na criação de modelos em barras, linhas e rankings horizontais. A interface foi desenvolvida com o framework Tailwind CSS. Para otimizar o fluxo de trabalho, utilizei inicialmente a distribuição via CDN para prototipagem rápida. Após definir as classes necessárias, migrei para a versão CLI, que é a recomendada para ambientes de produção, pois otimiza o tamanho final do arquivo CSS.

A apresentação dos dados conta com um gráfico geral para análise histórica das médias térmicas e um gráfico por décadas, que facilita a visualização de tendências de longo prazo. Além disso, implementei um Top 10 dos anos com maiores anomalias térmicas, permitindo o estudo direcionado de períodos específicos. Por fim, desenvolvi um dashboard interativo que possibilita ao usuário realizar consultas granulares por mês e ano, oferecendo uma exploração personalizada dos dados. Somado a isso, implementei um modo de exibição automática (slideshow) com controles de play/pause, que alterna entre as visualizações de forma dinâmica.

# Tecnologias

* **Linguagens:** JavaScript, HTML, CSS
* **Framework:** Tailwind CSS
* **Bibliotecas:** PapaParse, Chart.js    
