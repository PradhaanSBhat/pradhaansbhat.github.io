/*
 * ============================================================================
 *  PORTFOLIO CONTENT  —  this is the only file you normally edit.
 * ============================================================================
 *  It is a plain data object written exactly like JSON (it is a JSON superset:
 *  trailing commas and comments are allowed). Loading it as a .js file is what
 *  lets the site work by simply double-clicking index.html, with NO web server
 *  (browsers block fetch() of local .json files over file://).
 *
 *  RULES OF THUMB
 *   - A whole SECTION appears only when its array below has at least one item.
 *     Empty out `talks: []` and the Talks section + its nav link disappear.
 *   - For a publication, only the links you fill in render as buttons.
 *   - Each author is { name, url, eq }. `url` is optional — turns the name into
 *     a link. `eq: true` adds a superscript * and an "Equal contribution" note.
 *     `me` must match the author name you want emphasized (your own).
 *   - `highlight` may be "Spotlight", "Oral", "Best Paper", etc., or null.
 * ============================================================================
 */
window.PORTFOLIO = {

  /* ---- 1. PROFILE (hero + contact) -------------------------------------- */
  profile: {
    name: "Pradhaan S Bhat",
    role: "Predoctoral Researcher · Generative computer vision",
    affiliation: "VAL, IISc",
    location: "Bangalore, India",
    // The hero portrait cycles through these with a "denoise" (noise → image)
    // reveal. Use one image for a static portrait, or several to rotate.
    // portraits: ["assets/portrait.jpeg", "assets/portrait-2.jpeg", "assets/portrait-3.jpeg"],
    portraits: ["assets/portrait-3.jpeg"],

    email: "psb.compsci@gmail.com",
    // Para 1 of the About section.
    bio: 'I am a Predoctoral researcher at the <a href="https://val.cds.iisc.ac.in/" target="_blank" rel="noopener">Vision & AI Lab</a>, Indian Institute of Science advised by <a href="https://cds.iisc.ac.in/faculty/venky/" target="_blank" rel="noopener">Prof. R. Venkatesh Babu</a>, <a href="https://anandbhattad.github.io/" target="_blank" rel="noopener">Prof. Anand Bhattad</a> and <a href="http://luthuli.cs.uiuc.edu/~daf/" target="_blank" rel="noopener">Prof. D. A. Forsyth</a>, specializing in spatial intelligence for generative modelling. Previously, I was a research intern here, and I completed my undergraduate degree in Computer Science at PES University in May 2026.',
    // Para 2 of the About section (your research interests, in prose).
    interests: "My work centers on advancing controllable image generation, where I focus on enhancing structural diversity and spatial intelligence in diffusion and flow-based architectures. My research bridges the gap between black-box model outputs and human-intuitive interaction, building interfaces that allow for granular control over generative models. Broadly, my research interests span:",
    // Shown as the row of chips under the bio. `type` picks the icon.
    links: [
      // { type: "cv",       label: "CV",            url: "assets/cv.pdf" },  // uncomment when ready
      { type: "scholar",  label: "Scholar",       url: "https://scholar.google.com/citations?hl=en&user=MIg-6OEAAAAJ" },
      { type: "github",   label: "GitHub",        url: "https://github.com/PradhaanSBhat" },
      { type: "twitter",  label: "Twitter / X",   url: "https://twitter.com/PradhaanSBhat" },
      { type: "linkedin", label: "LinkedIn",      url: "https://linkedin.com/in/pradhaan-s-bhat" },
      { type: "email",    label: "Email",         url: "mailto:psb.compsci@gmail.com" }
    ]
  },

  /* ---- 2. RESEARCH INTERESTS (shown as clickable pills in the About section)
   *  `topic` must match the `topic` used on the publications below — clicking a
   *  pill jumps to Publications and highlights that topic.
   */
  research: [
    { icon: "ti-sparkles",        title: "Generative AI",                  topic: "Generative AI",  blurb: "Advancing structural diversity in diffusion and flow-based generative architectures." },
    { icon: "ti-cube-3d-sphere",  title: "Spatial Intelligence",           topic: "Spatial Intelligence", blurb: "Geometric reasoning and 3D-aware control in text-to-image generation." },
    { icon: "ti-adjustments",     title: "Human-Aligned Generative Control", topic: "Human-Aligned Generative Control", blurb: "Interfaces for granular, intuitive human control over generative models." }
  ],

  /* ---- 3. PUBLICATIONS (the centerpiece) -------------------------------- */
  publications: [
    {
      title: "Thinking in Boxes: 3D Editing in Images Made Easy",
      authors: [
        { name: "Pradhaan S Bhat", eq:true},
        { name: "Naveen Chandra R", url: "https://www.linkedin.com/in/naveen-chandra-r-7230aa192", eq:true},
        { name: "Rishubh Parihar", url: "https://rishubhpar.github.io/" },
        { name: "Vaibhav Vavilala", url: "https://www.linkedin.com/in/vaibhav-vavilala"},
        { name: "R. Venkatesh Babu", url: "https://cds.iisc.ac.in/faculty/venky/"},
        { name: "D.A Forsyth", url: "http://luthuli.cs.uiuc.edu/~daf/"},
        { name: "Anand Bhattad", url: "https://anandbhattad.github.io/"},
      ],
      me: "Pradhaan S Bhat",
      venue: "arXiv",
      year: 2026,
      topic: ["Spatial Intelligence","Human-Aligned Generative Control"],
      highlight: "",  // example — set to "Oral" / "Best Paper" / null
      teaser: "assets/teaser-1.svg",
      abstract: `Text and 2D-conditioning interfaces provide weak, ambiguous control over spatial
transformations in image editing – particularly under large object motions and
camera changes. Prior work has used 3D primitives such as boxes, but only as loose
conditioning signals indicating approximate object location rather than specifying
the transformation. We instead use 3D boxes as structured specifications: the user
provides the input and output boxes of the edit, casting editing as a well-posed
geometry problem. This “thinking in boxes” interface, where each box face is color-
coded to convey 3D orientation, gives precise control over translation, rotation,
scaling, and viewpoint changes in real images while preserving scene and object
identity, and recovering previously unseen object regions. To ground transforma-
tions in scene appearance, we introduce a depth-aligned planar floor as a global
reference frame, shaded with depth-aware cues. Conditioned on this structure, an
image generator produces consistent results under large transformations. Trained in
two stages – on synthetic multi-object scenes and a small set of real-world videos
from Objectron – the system generalizes to complex, in-the-wild real images. Our
method operates directly on real photographs and substantially outperforms recent
state-of-the-art methods on large 3D edits.`,
      links: {
        pdf:     "#",
        arxiv:   "#",
        code:    "#",
        project: "#",
        // The lightbox VIDEO is your presentation/talk video — different from the
        // `teaser` GIF above (which is the short demo shown on the card/spine/node).
        video:   "#"
      },
      bibtex: ""
    },

    {
      title: "Don't Settle at the Mode! Mitigating Diversity Collapse in Pretrained Flow Models via Feature Self-Guidance",
      authors: [
        { name: "Pradhaan S Bhat" , eq:true },
        { name: "Rishubh Parihar", url: "https://rishubhpar.github.io/", eq:true },
        { name: "Abhijnya Bhat", url: "https://ab-34.github.io/abhijnya/"},
        { name: "R. Venkatesh Babu", url: "https://cds.iisc.ac.in/faculty/venky/"},
      ],
      me: "Pradhaan S Bhat",
      venue: "ECCV",
      year: 2026,
      topic: "Generative AI",      // matches a research[].topic above
      highlight: "",  // example — set to "Oral" / "Best Paper" / null
      teaser: "assets/teaser-1.svg",
      abstract: `State-of-the-art flow models generate stunning images from text or image prompts. 
      However, they suffer from diversity collapse when generating multiple samples under the same conditioning. 
      Existing methods address this issue via either latent guidance, which has limited effectiveness, 
      or sample selection, which relies on external reward models that incur significant inference-time overhead. 
      In this work, we introduce an efficient, training-free self-guidance mechanism to mitigate diversity collapse 
      without requiring additional reward models. Specifically, we disperse the internal features of the flow model 
      during batch generation with **feature self-guidance**. Further, to keep the features close to the manifold, 
      we introduce a **manifold regularization** step that projects these dispersed features back onto
      the data manifold, ensuring diverse generation without sacrificing alignment with the input conditions. 
      Our method integrates seamlessly as a plug-and-play module into pretrained flow models, adding only a marginal 
      inference cost. Experiments demonstrate significant improvements in diversity while preserving fidelity across 
      several conditional flow models, including multi-step and few-step text-to-image, depth-to-image, and reference 
      image generation.`,
      links: {
        pdf:     "#",
        arxiv:   "#",
        code:    "#",
        project: "#",
        // The lightbox VIDEO is your presentation/talk video — different from the
        // `teaser` GIF above (which is the short demo shown on the card/spine/node).
        video:   "#"
      },
      bibtex: ""
    },

    {
      title: "SeeThrough3D: Occlusion Aware 3D Control in Text-to-Image Generation",
      authors: [
        { name: "Vaibhav Agrawal", url: "https://va1bhavagrawal.github.io/"},
        { name: "Rishubh Parihar", url: "https://rishubhpar.github.io/"},
        { name: "Pradhaan S Bhat"},
        { name: "Ravi Kiran Saradevabhatla", url: "https://ravika.github.io/" },
        { name: "R. Venkatesh Babu", url: "https://cds.iisc.ac.in/faculty/venky/" }
      ],
      me: "Pradhaan S Bhat",
      venue: "CVPR",
      year: 2026,
      topic: ["Spatial Intelligence","Human-Aligned Generative Control"],
      highlight: "",
      abstract: `We identify occlusion reasoning as a fundamental yet overlooked aspect for 3D layout–conditioned generation. 
      It is essential for synthesizing partially occluded objects with depth-consistent geometry and scale. 
      While existing methods can generate realistic scenes that follow input layouts, they often fail to model precise
      inter-object occlusions. We propose \textbf{SeeThrough3D}, a model for 3D layout conditioned generation that
      explicitly models occlusions. We introduce an occlusion-aware 3D scene representation (OSCR), where objects are 
      depicted as translucent 3D boxes placed within a virtual environment and rendered from desired camera viewpoint. 
      The transparency encodes hidden object regions, enabling the model to reason about occlusions, while the rendered
      viewpoint provides explicit camera control during generation. We condition a pretrained flow based text-to-image 
      image generation model by introducing a set of visual tokens derived from our rendered 3D representation. 
      Furthermore, we apply masked self-attention to accurately bind each object bounding box to its corresponding 
      textual description, enabling accurate generation of multiple objects without object attribute mixing. 
      To train the model, we construct a synthetic dataset with diverse multi-object scenes with strong inter-object 
      occlusions. SeeThrough3D generalizes effectively to unseen object categories and enables precise 3D layout control
      with realistic occlusions and consistent camera control.`,
      teaser: "assets/teaser-2.svg",
      links: {
        pdf:     "https://arxiv.org/pdf/2602.23359",
        arxiv:   "https://arxiv.org/abs/2602.23359",
        code:    "https://github.com/va1bhavagrawal/seethrough3d",
        project: "https://seethrough3d.github.io/",
        // The lightbox VIDEO is your presentation/talk video — different from the
        // `teaser` GIF above (which is the short demo shown on the card/spine/node).
        video:   "https://seethrough3d.github.io/teaser.mp4",
      },
      bibtex: `
@inproceedings{agrawal2026seethrough3d,
  title={Seethrough3d: Occlusion aware 3d control in text-to-image generation},
  author={Agrawal, Vaibhav and Parihar, Rishubh and Bhat, Pradhaan S and Sarvadevabhatla, Ravi Kiran and Radhakrishnan, Venkatesh Babu},
  booktitle={Proceedings of the IEEE/CVF Conference on Computer Vision and Pattern Recognition},
  pages={25403--25414},
  year={2026}
}`
    },
  ],

  /* ---- 4. NEWS / UPDATES  (optional — clear the array to hide) ----------
   *  Items dated within the last 30 days get an automatic "New" badge.
   *  Add `new: true` to an item to force the badge regardless of date.
   */
  news: [
    { date: "Jun 2026", new: true, text: "<strong>Thinking in Boxes: 3D Editing in Real Images Made Easy</strong> released on arXiv." },
    { date: "Jun 2026", new: true, text: "<strong>Don't Settle at the Mode! Mitigating Diversity Collapse in Pretrained Flow Models via Feature Self-Guidance</strong> accepted at ECCV 2026!" },
    { date: "Jun 2026", new: true, text: "Working as a Predoctoral Researcher at VAL, IISc." },
    { date: "Feb 2026", text: "<strong>SeeThrough3D: Occlusion Aware 3D Control in Text-to-Image Generation</strong> accepted at CVPR 2026!" },
    { date: "May 2024", text: "Started a research internship at VAL, IISc." }
  ],

  /* ---- 5. TALKS  (empty for now — add items and the section appears) ----- */
  talks: [],

  /* ---- 6. AWARDS & HONORS  (empty for now — add items to show) ---------- */
  awards: [],

  /* ---- 7. TEACHING & SERVICE  (optional) -------------------------------- */
  teaching: [
    // { term: "Ongoing",     role: "Reviewer",           course: "CVPR, NeurIPS, ICLR" }
    { term: "Fall 2025", role: "Teaching assistant", course: "Video Processing & Understanding" },
    // { term: "Fall 2025",   role: "Guest lecturer",     course: "Introduction to Machine Learning" },
  ]
};
