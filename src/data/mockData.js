// Dados de exemplo — substitua pela leitura real assim que o Supabase
// estiver conectado (veja src/lib/supabaseClient.js e README.md).

export const mockPosts = [
  {
    id: 'p1',
    author: 'Camila R.',
    initial: 'C',
    time: 'há 2h',
    text: 'Gente, fechei minha primeira venda do meu infoproduto de emagrecimento pós-parto hoje! Segui o passo a passo da aula 3 e deu muito certo 🎉',
    likes: 24,
    comments: 6,
  },
  {
    id: 'p2',
    author: 'Diego M.',
    initial: 'D',
    time: 'há 5h',
    text: 'Alguém mais está usando a Ferramenta pra gerar a oferta? Terminei a etapa 4 e o resultado ficou muito além do que eu esperava.',
    likes: 18,
    comments: 11,
  },
  {
    id: 'p3',
    author: 'Ana Paula S.',
    initial: 'A',
    time: 'há 1 dia',
    text: 'Dica pra quem está travado na parte de copy: revejam a aula "Gatilhos mentais que convertem". Mudou completamente meu anúncio.',
    likes: 41,
    comments: 9,
  },
]

export const mockLessons = {
  featured: {
    id: 'l0',
    title: 'Comece aqui: como funciona a Mentoria Império',
    description:
      'Antes de mais nada, assista essa aula para entender a jornada completa dentro do sistema e como tirar o máximo proveito de cada etapa.',
    youtubeId: 'dQw4w9WgXcQ',
    duration: '12 min',
  },
  progress: 0.35,
  modules: [
    {
      id: 'm1',
      title: 'Descobrindo seu nicho',
      youtubeId: 'dQw4w9WgXcQ',
      duration: '18 min',
      views: 1240,
      comments: 34,
      done: true,
    },
    {
      id: 'm2',
      title: 'Estruturando a oferta',
      youtubeId: 'dQw4w9WgXcQ',
      duration: '22 min',
      views: 980,
      comments: 21,
      done: true,
    },
    {
      id: 'm3',
      title: 'Gatilhos mentais que convertem',
      youtubeId: 'dQw4w9WgXcQ',
      duration: '15 min',
      views: 1560,
      comments: 58,
      done: false,
    },
    {
      id: 'm4',
      title: 'Criando seu funil de vendas',
      youtubeId: 'dQw4w9WgXcQ',
      duration: '27 min',
      views: 870,
      comments: 19,
      done: false,
    },
    {
      id: 'm5',
      title: 'Tráfego pago do zero',
      youtubeId: 'dQw4w9WgXcQ',
      duration: '31 min',
      views: 1120,
      comments: 40,
      done: false,
    },
    {
      id: 'm6',
      title: 'Escalando seus resultados',
      youtubeId: 'dQw4w9WgXcQ',
      duration: '19 min',
      views: 640,
      comments: 12,
      done: false,
    },
  ],
}
