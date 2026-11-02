# DinoPédia

MVP navegável da plataforma educativa descrita no Documento de Arquitetura DinoPédia.

## Executar

O projeto é uma aplicação estática sem dependências de build. Abra `index.html` no navegador ou sirva a pasta com:

```bash
python3 server.py
```

Para usar o catálogo e os filtros, prefira iniciar o servidor e acessar
`http://localhost:4173`; a abertura direta do arquivo HTML não fornece a API
local necessária para carregar as espécies.

Na primeira execução, o servidor cria `dinopedia.sqlite3` e importa o catálogo disponível na API pública Dinosaur Facts API. A API local fica disponível em `GET /api/dinosaurs?search=rex&diet=Carnívoro`.

A busca aceita texto com espaços e acentos, limita resultados entre 1 e 1000 e
retorna `total` já considerando os filtros aplicados. Se o catálogo remoto
estiver indisponível, os dados existentes são preservados e uma espécie de
fallback é criada apenas quando o banco ainda está vazio.

## Entregue neste MVP

- Catálogo pesquisável com filtros por dieta e cartões de espécies.
- Linha do tempo interativa do Permiano ao Cenozoico.
- Quiz educativo com pontuação.
- Design responsivo, navegação por âncoras e base de acessibilidade.
- Tema alternativo pelo botão no cabeçalho.
- Catálogo SQLite populado automaticamente com centenas de espécies.
- API HTTP local para busca, filtro e paginação do catálogo.
- Visualizador WebGL 3D estilizado para cada espécie, sem exigir um arquivo 3D por animal.

## Sobre os modelos 3D

Não existe uma API pública que forneça um modelo anatômico 3D licenciado para *todas* as espécies conhecidas. O visualizador usa Three.js e gera uma representação 3D interativa por espécie; isso evita atribuir um modelo de outra espécie ao animal selecionado. Modelos GLB de museus ou fornecedores podem ser adicionados posteriormente por meio de uma tabela de assets licenciados.

### Modelos reais integrados

O laboratório carrega modelos GLB reais licenciados do Poly Pizza para Tyrannosaurus rex, Velociraptor, Triceratops, Diplodocus, Parasaurolophus, Stegosaurus e Apatosaurus. Os seis modelos CC0 são de domínio público; o Diplodocus é CC BY 3.0 e requer atribuição conforme a página do modelo. As demais espécies usam o fallback procedural até que um modelo real com licença verificável seja cadastrado.


As integrações de backend, persistência SQLite/Redis, autenticação, CMS, modelos 3D e IA adaptativa ficam preparadas como próximas camadas da arquitetura; esta primeira entrega prioriza uma experiência funcional e demonstrável sem dependências externas.
