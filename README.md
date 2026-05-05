<!--
  ┌──────────────────────────────────────────────────────────────────────┐
  │  PLATE GH · OPEN SOURCE                            AMSTERDAM · 2026  │
  │                                                                      │
  │     Tony Yang  杨童耘                                                 │
  │     INDEPENDENT AI RESEARCHER · AMSTERDAM                            │
  │                                                                      │
  │     ~~~~~~~~~~~                                                      │
  │     building useful, durable AI                                      │
  │                                                                      │
  │  § N° 01 · IDENTITY                                and we tinker.    │
  └──────────────────────────────────────────────────────────────────────┘
  Hand-built, no template ancestry. Companion to https://tonyyunyang.github.io.
-->

<!-- ============================================================
     HERO BANNER — light/dark adaptive via <picture>
     ============================================================ -->

<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="./assets/banner-dark.svg">
    <source media="(prefers-color-scheme: light)" srcset="./assets/banner-light.svg">
    <img alt="Tony Yang · Independent AI Researcher · Amsterdam" src="./assets/banner-light.svg" width="100%">
  </picture>
</p>

<!-- ============================================================
     QUICK LINKS · light, editorial flat-square pills
     The banner already carries the tagline. The pills sit just below
     it as a quiet directory, not a second hero. paper-shade label +
     emerald body keeps them in the same key as the plate.
     ============================================================ -->

<p align="center">
  <a href="https://tonyyunyang.github.io/"><img alt="Studio · personal site" src="https://img.shields.io/badge/Studio-tonyyunyang.github.io-0E5347?style=flat-square&labelColor=EDE6D5&logo=safari&logoColor=0E5347"></a>
  <a href="https://scholar.google.com/citations?hl=en&user=rIFdBYAAAAAJ"><img alt="Google Scholar" src="https://img.shields.io/badge/Scholar-Profile-0E5347?style=flat-square&labelColor=EDE6D5&logo=google-scholar&logoColor=0E5347"></a>
  <a href="mailto:tonyyunyang@outlook.com"><img alt="Email" src="https://img.shields.io/badge/Email-tonyyunyang@outlook.com-0E5347?style=flat-square&labelColor=EDE6D5&logo=maildotru&logoColor=0E5347"></a>
  <a href="https://tonyyunyang.github.io/cv-en.pdf"><img alt="CV English" src="https://img.shields.io/badge/CV-English-0E5347?style=flat-square&labelColor=EDE6D5&logo=readthedocs&logoColor=0E5347"></a>
  <a href="https://tonyyunyang.github.io/cv-zh.pdf"><img alt="CV 中文" src="https://img.shields.io/badge/CV-%E4%B8%AD%E6%96%87-0E5347?style=flat-square&labelColor=EDE6D5&logo=readthedocs&logoColor=0E5347"></a>
</p>

<!-- A small editorial flourish to break into sections -->
<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="./assets/ornament-dark.svg">
    <source media="(prefers-color-scheme: light)" srcset="./assets/ornament-light.svg">
    <img alt="" src="./assets/ornament-light.svg" width="320" aria-hidden="true">
  </picture>
</p>

<!-- ============================================================
     §00 · CURRENTLY — what I'm doing right now
     ============================================================ -->

## §00 · Currently

<table>
<tr>
<td valign="top" width="62%">

An independent AI researcher in Amsterdam. I currently collaborate with **industry** (Tencent, Gradient Networks, MeetaVista) and **academia** (TU Delft, McGill, Tsinghua) on **cost-efficient LLMs**, **optimization-as-reasoning**, and **intent-aware world models**.

Earlier: Marie Skłodowska-Curie Fellow at **IMDEA Networks** (Madrid), AI Research Engineer at **TU Delft Imaging Physics**, MSc in Computer & Embedded Systems Engineering at **TU Delft**.

The throughline I care about: useful, durable AI, especially where access and reliability matter.

</td>
<td valign="top" width="38%" align="right">

<a href="https://tonyyunyang.github.io/#contact"><img alt="Open to research · academia or industry →" src="https://img.shields.io/badge/Open_to_research-academia_or_industry_%E2%86%92-0E5347?style=for-the-badge&labelColor=F5EFE2&logoColor=0E5347"></a>

<sub><i>Reach out for collaborations, PhD opportunities, or research roles in academia or industry.</i></sub>

<br><br>

<sub>📍 <b>Amsterdam</b> &nbsp;·&nbsp; previously Shanghai · Shenzhen · Madrid · Delft</sub>

</td>
</tr>
</table>

<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="./assets/ornament-dark.svg">
    <source media="(prefers-color-scheme: light)" srcset="./assets/ornament-light.svg">
    <img alt="" src="./assets/ornament-light.svg" width="320" aria-hidden="true">
  </picture>
</p>

<!-- ============================================================
     §01 · RESEARCH — featured papers as rich cards
     ============================================================ -->

## §01 · Research

<table>
<tr>
<td valign="top" width="50%">

### Through the Eyes of Emotion <sub>· IMWUT '25</sub>

A **multi-faceted eye-tracking dataset** for emotion recognition in VR. High-frame-rate periocular video (120 fps) + 240 Hz gaze across 26 participants and Ekman's seven basic emotions.

> _First dataset with high-frame-rate periocular videos. 4× higher gaze frequency than prior work. Open Unity collection + Label Studio annotation tools._

<sub>**Tongyun Yang**†, Bishwas Regmi†, Lingyu Du, Andreas Bulling, Xucong Zhang, Guohao Lan</sub>

<a href="https://dl.acm.org/doi/10.1145/3749545"><img alt="paper" src="https://img.shields.io/badge/Paper-IMWUT_2025-0E5347?style=flat-square&labelColor=14110D"></a>
<a href="https://github.com/tonyyunyang/Through-the-Eyes-of-Emotion"><img alt="code" src="https://img.shields.io/badge/Code-GitHub-0F1417?style=flat-square&labelColor=14110D&logo=github&logoColor=F5EFE2"></a>
<a href="https://zenodo.org/records/16790658"><img alt="dataset" src="https://img.shields.io/badge/Dataset-Zenodo-0E5347?style=flat-square&labelColor=14110D&logo=zenodo&logoColor=F5EFE2"></a>

</td>
<td valign="top" width="50%">

### Pruning nnU-Net <sub>· MIDL '25</sub>

**Over 80% of weights** in trained nnU-Net models can be removed via simple magnitude-based pruning, while keeping a proxy Dice score above 0.95 across multiple medical segmentation tasks.

> _Validated on 4 medical datasets, 2D & 3D. Critical weights cluster near encoder/decoder ends; bottlenecks are heavily prunable._

<sub>**Tongyun Yang**, Yidong Zhao, Qian Tao</sub>

<a href="https://openreview.net/forum?id=uTTOhthEDR"><img alt="paper" src="https://img.shields.io/badge/Paper-MIDL_2025-0E5347?style=flat-square&labelColor=14110D"></a>
<a href="https://github.com/tonyyunyang/pruning_nnunet"><img alt="code" src="https://img.shields.io/badge/Code-GitHub-0F1417?style=flat-square&labelColor=14110D&logo=github&logoColor=F5EFE2"></a>

</td>
</tr>
</table>

<details>
<summary><sub><b>§01b · Other publications</b> &nbsp; <i>(click to unfold)</i></sub></summary>

<br>

| Paper | Venue | Links |
|-------|-------|-------|
| **Reverse Imaging: Any-Sequence Generalization for Cardiac MRI Segmentation** | MICCAI 2025 & IEEE TMI | [Paper](https://papers.miccai.org/miccai-2025/0780-Paper2605.html) · [Code](https://github.com/Ido-zh/cmr_reverse) |

</details>

<br>

### §01c · Research compass

<sub><i>Two threads run through every paper here: pushing AI beyond text into perception and action, and making those systems fairer and more reachable in practice.</i></sub>

<table>
<tr>
<td valign="top" width="33%">

**🜨&nbsp; World models**
<br><sub>Systems that perceive a scene and imagine what happens next. The bridge from describing the world to acting in it.</sub>

</td>
<td valign="top" width="33%">

**◉&nbsp; Large language models**
<br><sub>Making capable models cheap, dependable, and useful enough to actually deploy. Routing, optimization, agent design.</sub>

</td>
<td valign="top" width="33%">

**◐&nbsp; Computer vision**
<br><sub>Vision as a channel for human signal, not just object detection. Reading emotion, intent, attention from what people see.</sub>

</td>
</tr>
<tr>
<td valign="top">

**♥&nbsp; AI for medicine**
<br><sub>Models that work in the real clinic, not only on the leaderboard. Smaller, faster, and fair across patient populations.</sub>

</td>
<td valign="top">

**⛨&nbsp; AI safety**
<br><sub>Building things that behave reliably when they leave the lab. Robustness, evaluation, the unglamorous work of trust.</sub>

</td>
<td valign="top">

**⌂&nbsp; Fairness × access**
<br><sub>A motivation, not a sub-field. Anything I build should reach the people who need it most, not the people who already have everything.</sub>

</td>
</tr>
</table>

<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="./assets/ornament-dark.svg">
    <source media="(prefers-color-scheme: light)" srcset="./assets/ornament-light.svg">
    <img alt="" src="./assets/ornament-light.svg" width="320" aria-hidden="true">
  </picture>
</p>

<!-- ============================================================
     §02 · OPEN SOURCE — featured repos as cards
     ============================================================ -->

## §02 · Open Source

<table>
<tr>
<td valign="top" width="33%">

### <a href="https://github.com/tonyyunyang/tonyyunyang.github.io">tonyyunyang.github.io</a>

<sub><code>Astro</code> · <code>Tailwind v4</code> · <code>TypeScript</code></sub>

Hand-built personal site, single-author, no template ancestry. Atelier × Cinema design language with Pagefind search and a hand-drawn Studio scene.

<sub><a href="https://tonyyunyang.github.io/">Live →</a></sub>

</td>
<td valign="top" width="33%">

### <a href="https://github.com/tonyyunyang/Scholar-High-Lights">Scholar High Lights</a>

<sub><code>JavaScript</code> · <code>Chrome ext</code></sub>

Highlighting + organizing research papers on Google Scholar. Colored notes that persist across sessions, exportable for your own zettelkasten.

<sub><a href="https://github.com/tonyyunyang/Scholar-High-Lights">Repo →</a></sub>

</td>
<td valign="top" width="33%">

### <a href="https://github.com/tonyyunyang/pruning_nnunet">pruning_nnunet</a>

<sub><code>Python</code> · <code>PyTorch</code> · <code>MIDL '25</code></sub>

Reference implementation for our MIDL '25 paper on pruning trained nnU-Net models. Magnitude-based, 80%+ reduction, 2D & 3D.

<sub><a href="https://openreview.net/forum?id=uTTOhthEDR">Paper →</a></sub>

</td>
</tr>
</table>

<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="./assets/ornament-dark.svg">
    <source media="(prefers-color-scheme: light)" srcset="./assets/ornament-light.svg">
    <img alt="" src="./assets/ornament-light.svg" width="320" aria-hidden="true">
  </picture>
</p>

<!-- ============================================================
     §03 · STACK · monoline pills, no vendor color
     The skillicons API renders saturated brand-colored squares that
     became the loudest field on the page. Swapped for shields.io
     flat pills that share the page palette (paper-shade label,
     emerald body) so the stack reads as a list of tools, not a
     parade of logos.
     ============================================================ -->

## §03 · Stack

<p align="center"><i>Daily</i></p>
<p align="center">
  <img alt="Python" src="https://img.shields.io/badge/-Python-0E5347?style=flat-square&labelColor=EDE6D5&logo=python&logoColor=0E5347">
  <img alt="PyTorch" src="https://img.shields.io/badge/-PyTorch-0E5347?style=flat-square&labelColor=EDE6D5&logo=pytorch&logoColor=0E5347">
  <img alt="CUDA" src="https://img.shields.io/badge/-CUDA-0E5347?style=flat-square&labelColor=EDE6D5&logo=nvidia&logoColor=0E5347">
  <img alt="LaTeX" src="https://img.shields.io/badge/-LaTeX-0E5347?style=flat-square&labelColor=EDE6D5&logo=latex&logoColor=0E5347">
</p>

<p align="center"><i>Often</i></p>
<p align="center">
  <img alt="TensorFlow" src="https://img.shields.io/badge/-TensorFlow-4A5159?style=flat-square&labelColor=EDE6D5&logo=tensorflow&logoColor=4A5159">
  <img alt="Unity (XR)" src="https://img.shields.io/badge/-Unity_(XR)-4A5159?style=flat-square&labelColor=EDE6D5&logo=unity&logoColor=4A5159">
  <img alt="TypeScript" src="https://img.shields.io/badge/-TypeScript-4A5159?style=flat-square&labelColor=EDE6D5&logo=typescript&logoColor=4A5159">
  <img alt="C++" src="https://img.shields.io/badge/-C%2B%2B-4A5159?style=flat-square&labelColor=EDE6D5&logo=cplusplus&logoColor=4A5159">
  <img alt="Linux" src="https://img.shields.io/badge/-Linux-4A5159?style=flat-square&labelColor=EDE6D5&logo=linux&logoColor=4A5159">
</p>

<p align="center"><i>Reach for</i></p>
<p align="center">
  <img alt="React" src="https://img.shields.io/badge/-React-9C8F77?style=flat-square&labelColor=EDE6D5&logo=react&logoColor=9C8F77">
  <img alt="Node.js" src="https://img.shields.io/badge/-Node.js-9C8F77?style=flat-square&labelColor=EDE6D5&logo=nodedotjs&logoColor=9C8F77">
  <img alt="Docker" src="https://img.shields.io/badge/-Docker-9C8F77?style=flat-square&labelColor=EDE6D5&logo=docker&logoColor=9C8F77">
  <img alt="C" src="https://img.shields.io/badge/-C-9C8F77?style=flat-square&labelColor=EDE6D5&logo=c&logoColor=9C8F77">
  <img alt="Git" src="https://img.shields.io/badge/-Git-9C8F77?style=flat-square&labelColor=EDE6D5&logo=git&logoColor=9C8F77">
</p>

<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="./assets/ornament-dark.svg">
    <source media="(prefers-color-scheme: light)" srcset="./assets/ornament-light.svg">
    <img alt="" src="./assets/ornament-light.svg" width="320" aria-hidden="true">
  </picture>
</p>

<!-- ============================================================
     §04 · OPEN THE WORKSHOP — stats cards + snake graph
     ============================================================ -->

## §04 · Open the workshop

<!-- The github-readme-stats Vercel deployment hits its rate limit
     daily ("DEPLOYMENT_PAUSED"), so this section uses providers that
     stay up reliably: streak-stats.demolab.com, github-profile-trophy,
     and github-readme-activity-graph. All themed to the same emerald
     + paper palette via picture/prefers-color-scheme. -->

<p align="center">
  <a href="https://git.io/streak-stats">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://streak-stats.demolab.com?user=tonyyunyang&hide_border=true&background=14110D&stroke=2F261C&ring=5BC795&fire=5BC795&currStreakLabel=5BC795&currStreakNum=EFE4CE&sideLabels=EFE4CE&sideNums=EFE4CE&dates=9C8F77">
      <img alt="GitHub streak" height="170" src="https://streak-stats.demolab.com?user=tonyyunyang&hide_border=true&background=F5EFE2&stroke=D9D2C2&ring=0E5347&fire=0E5347&currStreakLabel=0E5347&currStreakNum=0F1417&sideLabels=0F1417&sideNums=0F1417&dates=4A5159">
    </picture>
  </a>
</p>

<!-- Trophies were tried (github-profile-trophy) but every theme they
     ship hardcodes its own card-bg outside the editorial palette
     (gray cards on cocoa, navy cards on cocoa, etc). Skipping in
     favor of two visualizations that respect the palette: an
     activity area-graph (next) and the snake (below). -->

<p align="center">
  <a href="https://github.com/Ashutosh00710/github-readme-activity-graph">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://github-readme-activity-graph.vercel.app/graph?username=tonyyunyang&bg_color=14110D&color=EFE4CE&line=5BC795&point=5BC795&area=true&area_color=5BC795&hide_border=true&custom_title=Contribution%20activity%20%C2%B7%20last%2030%20days">
      <img alt="Contribution activity, last 30 days" src="https://github-readme-activity-graph.vercel.app/graph?username=tonyyunyang&bg_color=F5EFE2&color=0F1417&line=0E5347&point=0F1417&area=true&area_color=0E5347&hide_border=true&custom_title=Contribution%20activity%20%C2%B7%20last%2030%20days">
    </picture>
  </a>
</p>

<!-- Snake contribution animation, generated by .github/workflows/snake.yml -->
<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/tonyyunyang/tonyyunyang/output/github-snake-dark.svg">
    <source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/tonyyunyang/tonyyunyang/output/github-snake.svg">
    <img alt="contribution snake" src="https://raw.githubusercontent.com/tonyyunyang/tonyyunyang/output/github-contribution-grid-snake.svg">
  </picture>
</p>

<sub align="center"><p align="center"><i>The snake is regenerated nightly by GitHub Actions, eating each day's contributions.</i></p></sub>

<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="./assets/ornament-dark.svg">
    <source media="(prefers-color-scheme: light)" srcset="./assets/ornament-light.svg">
    <img alt="" src="./assets/ornament-light.svg" width="320" aria-hidden="true">
  </picture>
</p>

<!-- ============================================================
     §05 · OFF THE PAGE — personality
     ============================================================ -->

## §05 · Off the page

<table>
<tr>
<td valign="top" width="50%">

> Originally from **Sichuan**. Now in **Amsterdam**, by the canals.
> Cooks **wok-fried Sichuan stir-fry** at home · dried chilis, garlic, peppercorns. Never a covered pot.

> Plays **tennis** with a Babolat Pure Drive (and a Wilson Blade for his wife).
> Half-marathon PB **1:43:53**. Aiming for sub-1:40.

</td>
<td valign="top" width="50%">

> Reads **Sartre** and the **Boom Latinoamericano** (Borges).
> Buys **tulips at the Bloemenmarkt** every spring.

> Planning to adopt **瓜子**, a 狸花猫 (Chinese mackerel tabby).
> Writes longhand with a **fountain pen** before any keyboard gets involved.

</td>
</tr>
</table>

<sub align="center"><p align="center"><i>For more, step into the <a href="https://tonyyunyang.github.io/world/">Studio</a> · a hand-drawn cross-section of the room.</i></p></sub>

<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="./assets/ornament-dark.svg">
    <source media="(prefers-color-scheme: light)" srcset="./assets/ornament-light.svg">
    <img alt="" src="./assets/ornament-light.svg" width="320" aria-hidden="true">
  </picture>
</p>

<!-- ============================================================
     §06 · CONNECT
     ============================================================ -->

## §06 · Connect

<table>
<tr>
<td valign="top" width="60%">

I read every message. The fastest way to reach me is **email**; for research context, the **personal site** has a richer page.

For collaborations, PhD opportunities, or research roles in academia or industry · open the door.

</td>
<td valign="top" width="40%" align="right">

<a href="mailto:tonyyunyang@outlook.com"><img alt="Email" src="https://img.shields.io/badge/Email-tonyyunyang@outlook.com-0E5347?style=flat-square&labelColor=EDE6D5&logo=maildotru&logoColor=0E5347"></a>
<br>
<a href="https://tonyyunyang.github.io/"><img alt="Studio" src="https://img.shields.io/badge/Studio-tonyyunyang.github.io-0E5347?style=flat-square&labelColor=EDE6D5&logo=safari&logoColor=0E5347"></a>
<br>
<a href="https://scholar.google.com/citations?hl=en&user=rIFdBYAAAAAJ"><img alt="Scholar" src="https://img.shields.io/badge/Scholar-Profile-0E5347?style=flat-square&labelColor=EDE6D5&logo=google-scholar&logoColor=0E5347"></a>
<br>
<a href="https://github.com/tonyyunyang"><img alt="GitHub" src="https://img.shields.io/badge/GitHub-tonyyunyang-0E5347?style=flat-square&labelColor=EDE6D5&logo=github&logoColor=0E5347"></a>

</td>
</tr>
</table>

<!-- ============================================================
     FOOTER — italic margin annotation, plate colophon
     ============================================================ -->

<br>

<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="./assets/ornament-dark.svg">
    <source media="(prefers-color-scheme: light)" srcset="./assets/ornament-light.svg">
    <img alt="" src="./assets/ornament-light.svg" width="320" aria-hidden="true">
  </picture>
</p>

<p align="center">
  <i>Built across LLMs, vision, world models, and clinical AI.</i>
  <br>
  <sub>PLATE GH · OPEN SOURCE · 2026 · AMSTERDAM</sub>
</p>

<p align="center">
  <a href="https://tonyyunyang.github.io/"><img alt="Profile views" src="https://komarev.com/ghpvc/?username=tonyyunyang&label=quiet+visits&color=0E5347&style=flat-square"></a>
</p>
