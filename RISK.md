def calc*risk(k, s, e, a, b, c, d, int_e, t):
try: # C = 1 / (1 + exp(-(aK + bS + cE + d(K*E) + e(S*E) - t)))
z = (a * k) + (b _ s) + (c _ e) + (d _ (k _ e)) + (int*e * (s \* e)) - t
c_val = 1 / (1 + math.exp(-z))
return 1 - c_val # Risco (R = 1 - C)
except Exception:
return 1.0

# Ciber Risk APP

## Modelo Matemático para calculo do risco em frameworks de SAT

#### Calcula a probabilidade de um comportamento seguro (1), traduzindo-a numa métrica de risco complementar (2).

Calculo por utilizador

(1)

$$
C = \frac{1}{1+e^{-(aK + bS + cE + d(K \cdot E) + e(S \cdot E) - t)}}
$$

(2)

$$
R = 1 - C
$$

Calculo por media de grupo

(1)

$$
C_{g,m} = \frac{1}{1+e^{-(aK_{g,m} + bS_{g,m} + cE_{g,m} + d(K_{g,m} \cdot E_{g,m}) + e(S_{g,m} \cdot E_{g,m}) - t)}}
$$

(2)

$$
R_{g,m} = 1 - C_{g,m}
$$

---

### Os parâmetros do modelo (a,b,c,d,e,t)

- Os pesos são definidos inicialmente no início do Plano Anual de Atividades, através de um inquérito
  "[Executive Survey](ExecutiveSurvey.md)" dirigido ao CISO da empresa e/ou aos administradores.

---

### As dimensões do modelo (K,S,E) são respetivamente.

#### (K) Conhecimento: Compreensão teórica.

- Avaliação com base na conclusão da formação e nas notas obtidas
  nas avaliações formais, entre (0,1).

  Este valor deve ser calculado com base na average de um score que é pra calculado para cada curso em que o utilizador está inscrito e para a sua performance ao responder á compliance.

  O score de um curso é calculado atraves da soma de 2 variaveis:

  1 - 1/ 1 + numero de erros a responder ao curso

  2 - Progressao no curso numero de secções concluida / numero total de secções

  Para isto devemos começar por adicionar ao modelo de UserProgress a coluna
  a registar os erros cometidos pelo utilizador no decorrer da realização do curso e o score calculado para o dado curso.

  O score do user em relação á compliance é calculado da seguinte forma:
  - Quantas vezes falhou á compliance (rever isto)

  - Percentagem final da compliance

  K ficaria então K = (score_curso_1 + score_curso_2 + ... + score_curso_n) / numero de cursos + score_compliance

#### (S) Sentimento: A perceção psicológica do risco, a confiança e o alinhamento com as políticas de segurança da organização.

- O [inquérito](UsersSurvey.md) dirigido aos colaboradores da organização, realizado após a formação, é considerado um valor quantitativo entre (0,1).

#### (E) Envolvimento: hábitos proativos, como a denúncia de tentativas de phishing e a participação voluntária em iniciativas de segurança. Este aspeto é composto por dois eventos:

#### 1 - Campanhas de treino de Phishing (ponderação)

- Abriu e-mail e reportou phishing (1)
- Abriu e-mail e não fez nenhuma ação ou reencaminhou (0,5)
- Clicou em link ou anexo (0.25)
- Introduziu credênciais (0)

> NOTA 1: Na eventualidade do utilizador realizar dois ou mais destes eventos, têm-se em conta somente o que tiver menor valor.

> NOTA 2: No entanto, prever para o caso de ser possível abrir o e-mail para reportar uma tentativa de phishing.

#### 2 - Atividades voluntarias de formação/gamificação (conta a nota quatitativa da atividade (0,1))

---

Too calculate the risk of a user you should do the following:

Implement factor-level caching and selective recalculation
Separate K, S, E into independent calculations
Result: 3x performance improvement, better transparency
Works for up to 10,000 users
Medium complexity, high benefits

tell me which variables will trigger recalculation for each of the factors

Add organization-level aggregates via materialized views
Dashboard queries become instant
Works for up to 100,000 users
Good for when dashboards become bottleneck
