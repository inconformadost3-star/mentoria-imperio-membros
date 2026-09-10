-- Popula os módulos e as aulas (só a estrutura/título, sem vídeo ainda) com
-- base na grade de curso que a Bia passou. Rode isto SÓ UMA VEZ no SQL
-- Editor do Supabase, depois que já tiver rodado a migration_005_modulos.sql
-- — se rodar de novo, vai duplicar tudo.
--
-- Cada aula fica com youtube_id vazio: ela aparece marcada como "Em breve"
-- pro aluno até você editar essa aula no Painel Admin e colar o ID do vídeo
-- do YouTube.

insert into public.modules (title, description, module_order) values
  ('Módulo 0 - Passo zero', null, 0),
  ('Módulo 1 - Conheça O Sistema', null, 1),
  ('Módulo 2 - Fundamentos / Pilares essenciais', null, 2),
  ('Módulo 3 - Espionagem e modelagem de ofertas', null, 3),
  ('Módulo 4 - Criando sua oferta', null, 4),
  ('Módulo 5 - Criando seu produto', null, 5),
  ('Módulo 6 - Criativos | Como vender o meu produto', null, 6),
  ('Módulo 7 - Estrutura de vendas', null, 7),
  ('Módulo 8 - Colocando o Produto no Ar', null, 8),
  ('Módulo 9 - Caixa rápido com TikTok', 'Vou ensinar exatamente o que eu faço', 9),
  ('Módulo 10 - Na prática', null, 10);

insert into public.lessons (title, description, module_id, module_order) values
  ('Você precisa assistir', null, (select id from public.modules where title = 'Módulo 0 - Passo zero'), 1),
  ('Suporte Whatsapp', null, (select id from public.modules where title = 'Módulo 0 - Passo zero'), 2),
  ('Como consumir o curso', null, (select id from public.modules where title = 'Módulo 0 - Passo zero'), 3),
  ('Como pedir ajuda e avançar mais rápido', null, (select id from public.modules where title = 'Módulo 0 - Passo zero'), 4),

  ('Introdução ao sistema, a IA', null, (select id from public.modules where title = 'Módulo 1 - Conheça O Sistema'), 1),
  ('Acessando o sistema na prática', null, (select id from public.modules where title = 'Módulo 1 - Conheça O Sistema'), 2),
  ('Visão estratégica da metodologia', null, (select id from public.modules where title = 'Módulo 1 - Conheça O Sistema'), 3),

  ('Como funciona vender um produto digital', null, (select id from public.modules where title = 'Módulo 2 - Fundamentos / Pilares essenciais'), 1),
  ('O que você pode criar e vender (tela)', null, (select id from public.modules where title = 'Módulo 2 - Fundamentos / Pilares essenciais'), 2),
  ('Conhecendo os termos', null, (select id from public.modules where title = 'Módulo 2 - Fundamentos / Pilares essenciais'), 3),
  ('Por que alguém compraria?', null, (select id from public.modules where title = 'Módulo 2 - Fundamentos / Pilares essenciais'), 4),

  ('AULA NOVA - NICHOS (tela)', null, (select id from public.modules where title = 'Módulo 3 - Espionagem e modelagem de ofertas'), 1),
  ('Espionagem - Como encontrar ideias de produtos', null, (select id from public.modules where title = 'Módulo 3 - Espionagem e modelagem de ofertas'), 2),
  ('Modelagem - Como usar referências sem copiar', null, (select id from public.modules where title = 'Módulo 3 - Espionagem e modelagem de ofertas'), 3),
  ('Entendi tudo, e agora? - Escolha a sua primeira ideia e defina para quem vender', null, (select id from public.modules where title = 'Módulo 3 - Espionagem e modelagem de ofertas'), 4),

  ('O que é oferta e por que ela é mais importante que o produto?', null, (select id from public.modules where title = 'Módulo 4 - Criando sua oferta'), 1),
  ('Copy - Gerando interesse no seu produto', 'O que é copy, porque ela é essencial, uma oferta com copy ruim não vende', (select id from public.modules where title = 'Módulo 4 - Criando sua oferta'), 2),
  ('A página que converte', 'O que a página precisa ter, pilares essenciais, uma estrutura mínima', (select id from public.modules where title = 'Módulo 4 - Criando sua oferta'), 3),
  ('Criando página de vendas passo a passo com IA', null, (select id from public.modules where title = 'Módulo 4 - Criando sua oferta'), 4),

  ('Criando seu produto com o sistema', null, (select id from public.modules where title = 'Módulo 5 - Criando seu produto'), 1),
  ('Aperfeiçoando o produto - Usando GammaApp', 'A pessoa melhora o produto usando só IA.', (select id from public.modules where title = 'Módulo 5 - Criando seu produto'), 2),
  ('Cadastrando o produto na plataforma', null, (select id from public.modules where title = 'Módulo 5 - Criando seu produto'), 3),
  ('Área de membros personalizada', null, (select id from public.modules where title = 'Módulo 5 - Criando seu produto'), 4),

  ('Criativos que vendem', null, (select id from public.modules where title = 'Módulo 6 - Criativos | Como vender o meu produto'), 1),
  ('Modelando na prática criativos na prática', null, (select id from public.modules where title = 'Módulo 6 - Criativos | Como vender o meu produto'), 2),
  ('Criativos infinitos', 'Como reciclar os ADS', (select id from public.modules where title = 'Módulo 6 - Criativos | Como vender o meu produto'), 3),

  ('Funil de vendas - Como oferecer complementos na hora da compra', null, (select id from public.modules where title = 'Módulo 7 - Estrutura de vendas'), 1),
  ('Criando OB e bônus com o sistema', null, (select id from public.modules where title = 'Módulo 7 - Estrutura de vendas'), 2),
  ('Upsell e downsell - não', null, (select id from public.modules where title = 'Módulo 7 - Estrutura de vendas'), 3),

  ('Como analisar resultados e quando fazer melhorias', null, (select id from public.modules where title = 'Módulo 10 - Na prática'), 1),
  ('Taxas de conversão', null, (select id from public.modules where title = 'Módulo 10 - Na prática'), 2),
  ('Primeira venda', null, (select id from public.modules where title = 'Módulo 10 - Na prática'), 3),
  ('Diferenciais', null, (select id from public.modules where title = 'Módulo 10 - Na prática'), 4),
  ('Minha página não está convertendo e agora?', null, (select id from public.modules where title = 'Módulo 10 - Na prática'), 5);
