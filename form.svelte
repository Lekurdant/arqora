<script>
  import {
    useForm,
    validators,
    HintGroup,
    Hint,
    email,
    required,
  } from "svelte-use-form";
  import { fade, slide, fly, crossfade } from "svelte/transition";
  import { sineOut, sineIn, elasticIn, elasticOut } from "svelte/easing";
  import { onMount } from "svelte";
  import { create_in_transition } from "svelte/internal";
  import { getNotificationsContext } from "svelte-notifications";
  import { Http } from "@Services/Http";
  const  addNotification  = getNotificationsContext();

  const form = useForm();
  const formData = new FormData();
  let activeform = null;
  let Answers = {
    type: [],
    lastname: null,
    firstname: null,
    phone: null,
    cdc: [],
    design: [],
    budget: [],
    email: null,
  };
  let pdf=[]
  let fileInput;
  let file;
  let issent = false;
  let isSuccess = false;
  
  const handleDataUpload = async () => {
    issent = true;
    try {
      // Convertir les pièces jointes PDF en dataURL pour API serverless
      const toDataUrl = (file) => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const pdfs = [];
      if (formData.has('pdfs[]')) {
        // FormData interne n'est pas lisible; on garde la liste `pdf` pour les noms seulement
      }

      const uploaded = [];
      for (let i = 0; i < pdf.length; i++) {
        // On ne dispose que des noms; on lit depuis l'input
        const files = fileInput?.files || [];
        const f = files[i];
        if (f) {
          if (f.type !== 'application/pdf') throw new Error('Upload PDF uniquement.');
          const dataUrl = await toDataUrl(f);
          uploaded.push({ filename: f.name, dataUrl });
        }
      }

      const payload = { answers: Answers, pdfs: uploaded };
      await window.fetch('/api/contact', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload)
      }).then(async r => {
        if (!r.ok) throw new Error(await r.text());
      });

      addNotification.addNotification({
        text: 'Merci de votre confiance!',
        position: 'bottom-right',
        type: 'success',
        removeAfter: 4000,
      });
      isSuccess = true;
    } catch (err) {
      addNotification.addNotification({
        text: 'Une erreur s\'est produite...',
        position: 'bottom-right',
        type: 'error',
        removeAfter: 4000,
      });
      issent = false;
      console.log(err);
    }
  };

  function handleFileUpload(e) {
    const files = e.target.files;
    let pdfs = []
    for (let i = 0; i < files.length; i++) {
    const file = files[i];
    console.log(`Uploading file: ${file.name}, size: ${file.size} bytes`);
    if (file.type !== 'application/pdf') {
      throw new Error('Please upload only PDF files.');
    }
    formData.append('pdfs[]', file, file.name); // 'pdfs[]' indicates this is an array of files
    pdf = [...pdf, file.name]

  }
 
  console.log(pdf)

  }

  function next() {
    if (activeform == 0 && Answers.type.length == 0) {
      addNotification.addNotification({
            text: 'Veuillez selectionner un type de projet',
            position: 'bottom-right',
            type: 'error',
            removeAfter: 4000,
           })
      return
    }
    if (activeform == 1 && (Answers.lastname == "" ||Answers.lastname == null)&& (Answers.firstname == "" ||Answers.firstname == null)) {
      addNotification.addNotification({
            text: 'Veuillez indiquer votre nom / prenom',
            position: 'bottom-right',
            type: 'error',
            removeAfter: 4000,
           })
      return
    }
    if (activeform == 2 && (Answers.cdc.length == 0)) {
      addNotification.addNotification({
            text: 'Repondez  par oui ou non ',
            position: 'bottom-right',
            type: 'error',
            removeAfter: 4000,
           })
      return
    }
    if (activeform == 3 && (Answers.design.length == 0)) {
      addNotification.addNotification({
            text: 'Veuillez selectionner un type de projet',
            position: 'bottom-right',
            type: 'error',
            removeAfter: 4000,
           })
      return
    }
    if (activeform == 4 && (Answers.budget.length == 0)) {
      addNotification.addNotification({
            text: 'Veuillez selectionner un type de budget',
            position: 'bottom-right',
            type: 'error',
            removeAfter: 4000,
           })
      return
    }
    if (activeform < 5) {
      activeform++;
    }
    console.log(activeform);
  }
  function previous() {
    console.log(activeform);
    if (activeform > 0) {
      activeform = activeform - 1;
    }
  }

  function selectcheckbox(e) {
    if (activeform == 0) {
      Answers.type.push(e.id);
    }
  }

  function deselectcheckbox(e) {
    if (activeform == 0) {
      var index = Answers.type.indexOf(e.id);
      if (index !== -1) {
        Answers.type.splice(index, 1);
      }
    }
  }

  function animatecheckbox(event) {
    const element = event.currentTarget;
    const isCurrentlyScaled = element.dataset.scaled === "true";

    element.dataset.scaled = (!isCurrentlyScaled).toString();

    if (isCurrentlyScaled) {
      const trans_out = create_in_transition(element, checkscale, {
        duration: 400,
        direction: "out",
      });
      trans_out.start();
      deselectcheckbox(event.target);
    } else {
      const trans_in = create_in_transition(element, checkscale, {
        duration: 400,
        direction: "in",
      });
      trans_in.start();
      selectcheckbox(event.target);
    }
  }

  function handleSingleChoice(event) {
    const clickedElement = event.currentTarget;
    const group = clickedElement.closest(".checkbox_wrap");

    if (group.dataset.isAnimating === "true") {
      return;
    }

    if (clickedElement.dataset.scaled === "true") {
      return;
    }

    group.dataset.isAnimating = "true";

    const allCheckboxesInGroup = group.querySelectorAll(
      ".w-checkbox.checkbox-field"
    );

    allCheckboxesInGroup.forEach((checkbox) => {
      if (checkbox.dataset.scaled === "true") {
        checkbox.dataset.scaled = "false";
        const trans_out = create_in_transition(checkbox, checkscale, {
          duration: 400,
          direction: "out",
        });
        trans_out.start();
      }
    });

    clickedElement.dataset.scaled = "true";
    const trans_in = create_in_transition(clickedElement, checkscale, {
      duration: 400,
      direction: "in",
    });
    trans_in.start();

    const inputId = clickedElement.querySelector("input").id;
    if (activeform == 2) {
      Answers.cdc = [inputId];
    }
    if (activeform == 3) {
      Answers.design = [inputId];
    }
    if (activeform == 4) {
      Answers.budget = [inputId];
    }

    setTimeout(() => {
      group.dataset.isAnimating = "false";
    }, 400);
  }

  function checkscale(node, { duration, direction }) {
    const isScalingIn = direction === "in";

    const finalStyle = {
      backgroundColor: "rgb(241, 255, 249)",
      transform:
        "translate3d(0px, 0px, 0px) scale3d(1.05, 1.05, 1) rotateX(0deg) rotateY(0deg) rotateZ(0deg) skew(0deg)",
      borderColor: "rgb(54, 179, 126)",
      transformStyle: "preserve-3d",
    };
    const initialStyle = {
      backgroundColor: "rgb(255, 255, 255)",
      transform:
        "translate3d(0px, 0px, 0px) scale3d(1.0, 1.0, 1) rotateX(0deg) rotateY(0deg) rotateZ(0deg) skew(0deg)",
      borderColor: "rgba(62, 52, 200, 0.1)",
      transformStyle: "preserve-3d",
    };

    return {
      duration,
      css: (t, u) => {
        const eased = elasticOut(t);
        
        const progress = isScalingIn ? eased : 1 - eased;
        
        const scale = 1 + 0.05 * progress;

        const lerp = (start, end, t) => start * (1 - t) + end * t;

        const borderColorStart = { r: 62, g: 52, b: 200, a: 0.1 };
        const borderColorEnd = { r: 54, g: 179, b: 126, a: 1 };
        const backgroundColorStart = { r: 255, g: 255, b: 255 };
        const backgroundColorEnd = { r: 241, g: 255, b: 249 };

        const borderColor = `rgba(${~~lerp(
          borderColorStart.r,
          borderColorEnd.r,
          progress
        )}, ${~~lerp(
          borderColorStart.g,
          borderColorEnd.g,
          progress
        )}, ${~~lerp(
          borderColorStart.b,
          borderColorEnd.b,
          progress
        )}, ${lerp(borderColorStart.a, borderColorEnd.a, progress)})`;

        const backgroundColor = `rgb(${~~lerp(
          backgroundColorStart.r,
          backgroundColorEnd.r,
          progress
        )}, ${~~lerp(
          backgroundColorStart.g,
          backgroundColorEnd.g,
          progress
        )}, ${~~lerp(
          backgroundColorStart.b,
          backgroundColorEnd.b,
          progress
        )})`;

        return `
                background-color: ${backgroundColor};
                transform: translate3d(0px, 0px, 0px) scale3d(${scale}, ${scale}, 1) rotateX(0deg) rotateY(0deg) rotateZ(0deg) skew(0deg);
                transform-style: preserve-3d;
                border-color: ${borderColor};`;
      },
      tick: (t, u) => {
        if (t === 1) {
          if(isScalingIn) Object.assign(node.style, finalStyle);
        }
        if (t === 0) {
          if(!isScalingIn) Object.assign(node.style, initialStyle);
        }
      },
    };
  }

  onMount(() => {
    activeform = 0;
  });

  $: if (isSuccess) {
    setTimeout(() => {
      window.location.href = "/";
    }, 5000);
  }
</script>

{#if !isSuccess}
  <div class="form-wrapper w-form">
    <div class="mask w-slider-mask">
      <div data-w-id="b0b58362-0f4c-d6cc-f71c-017ee005ccd8" class="slide w-slide">
        <div class="slider-content-wrap">
          {#if activeform == 0}
            <div
              class="form-content"
              in:fly={{
                delay: 100,
                duration: 300,
                x: 0,
                y: 25,
                opacity: 0,
                easing: sineOut,
              }}
            >
              <div class="form-title-wrap">
                <div class="form-section-title">Que recherchez-vous ?</div>
              </div>
              <div class="checkbox_wrap">
                <label
                  class="w-checkbox checkbox-field form12_checkbox_field"
                  on:click={animatecheckbox}
                  ><input
                    type="checkbox"
                    id="Portefolio"
                    name="Portefolio"
                    data-name="web design"
                    data-w-id="b0b58362-0f4c-d6cc-f71c-017ee005cce2"
                    class="w-checkbox-input checkbox"
                  /><img
                    width="60"
                    src="https://uploads-ssl.webflow.com/654fdc5ad6f9d81d70119e32/654fdc5ad6f9d81d70119ea1_icon%2001.svg"
                    alt=""
                    class="checkbox-image"
                  /><span for="design" class="checkbox-title w-form-label"
                    >Site Portefolio<br />(NoCode)</span
                  ></label
                ><label
                  class="w-checkbox checkbox-field form12_checkbox_field"
                  on:click={animatecheckbox}
                  ><input
                    type="checkbox"
                    id="SPA"
                    name="Webflow-Build"
                    data-name="Webflow Build"
                    data-w-id="b0b58362-0f4c-d6cc-f71c-017ee005cce9"
                    class="w-checkbox-input checkbox"
                  /><img
                    width="60"
                    src="https://uploads-ssl.webflow.com/654fdc5ad6f9d81d70119e32/654fdc5ad6f9d81d70119e9e_icon%2004.svg"
                    alt=""
                    class="checkbox-image"
                  /><span for="Webflow-Build" class="checkbox-title w-form-label"
                    >Application Avancée<br />(Integration, SPA)<br /></span
                  ></label
                ><label
                  class="w-checkbox checkbox-field form12_checkbox_field"
                  on:click={animatecheckbox}
                  ><input
                    type="checkbox"
                    id="Webflow Support"
                    name="Webflow-Support"
                    data-name="Webflow Support"
                    data-w-id="b0b58362-0f4c-d6cc-f71c-017ee005ccf0"
                    class="w-checkbox-input checkbox"
                  /><img
                    width="60"
                    src="https://uploads-ssl.webflow.com/654fdc5ad6f9d81d70119e32/654fdc5ad6f9d81d70119e9c_icon%2003.svg"
                    alt=""
                    class="checkbox-image"
                  /><span
                    for="Webflow-Support"
                    class="checkbox-title w-form-label"
                    >Application Metier<br />(Mobile, Webapp)</span
                  ></label
                ><label
                  class="w-checkbox checkbox-field form12_checkbox_field"
                  on:click={animatecheckbox}
                  ><input
                    type="checkbox"
                    id="Other"
                    name="Other"
                    data-name="Other"
                    data-w-id="b0b58362-0f4c-d6cc-f71c-017ee005ccf7"
                    class="w-checkbox-input checkbox"
                  /><img
                    width="60"
                    src="https://uploads-ssl.webflow.com/654fdc5ad6f9d81d70119e32/654fdc5ad6f9d81d70119e9e_icon%2004.svg"
                    alt=""
                    class="checkbox-image"
                  /><span for="Other" class="checkbox-title w-form-label"
                    >SEO & Marketing</span
                  ></label
                >
              </div>
            </div>
            <div class="title-left" o>
              <div class="text-block-3">Formulaire</div>
            </div>
            <div class="details-right">
              <img
                alt=""
                src="https://uploads-ssl.webflow.com/654fdc5ad6f9d81d70119e32/654fdc5ad6f9d81d70119e9a_1.svg"
                class="counter-image"
              />
              <div class="text-counter">1 / 6</div>
            </div>
          {/if}
          {#if activeform == 1}
            <div
              class="form-content"
              in:fly={{
                delay: 100,
                duration: 300,
                x: 0,
                y: 25,
                opacity: 0.5,
                easing: sineOut,
              }}
            >
              <div class="form-title-wrap">
                <div class="form-section-title">
                  Nous sommes impatients de vous rencontrer.
                </div>
                <p class="paragraph">
                  Vos informations sont bien gardée! Remplissez la suite de ce
                  formulaire pour que l'on puisse mieux comprendre les besoins de
                  votre projet<br />
                </p>
              </div>
              <div class="form-wrap-full">
                <div class="form-wrap">
                  <div class="field-title">Votre nom</div>
                  <input
                    type="text"
                    class="field-input w-input"
                    maxlength="256"
                    name="Customers-Name"
                    data-name="Customers Name"
                    placeholder=""
                    id="Customers-Name"
                    bind:value={Answers.firstname}
                  />
                </div>
                <div class="form-wrap">
                  <div class="field-title">Votre prénom</div>
                  <input
                    type="text"
                    class="field-input w-input"
                    maxlength="256"
                    name="Customers-Name-4"
                    data-name="Customers Name 4"
                    placeholder=""
                    id="Customers-Name-4"
                    bind:value={Answers.lastname}
                  />
                </div>
                <div class="form-wrap">
                  <div class="field-title">
                    Votre numéro de téléphone (optionnel)
                  </div>
                  <input
                    class="field-input w-input"
                    name="Customers-Name-3"
                    data-name="Customers Name 3"
                    placeholder="(+33)"
                    id="Customers-Name-3"
                    bind:value={Answers.phone}
                  />
                </div>
              </div>
            </div>

            <div class="title-left">
              <div class="text-block-3">Coordonnées</div>
            </div>
            <div class="details-right">
              <img
                alt=""
                src="https://uploads-ssl.webflow.com/654fdc5ad6f9d81d70119e32/654fdc5ad6f9d81d70119e99_2.svg"
                class="counter-image"
              />
              <div class="text-counter">2 / 6</div>
            </div>
          {/if}
          {#if activeform == 2}
            <div class="form-content">
              <div
                class="form-title-wrap"
                in:fly={{
                  delay: 100,
                  duration: 300,
                  x: 0,
                  y: 25,
                  opacity: 0.5,
                  easing: sineOut,
                }}
              >
                <div class="form-section-title">
                  Avez-vous établit un cahier des charges?
                </div>
                <p class="paragraph">
                  Pas d'inquiétude! Nous pouvons vous accompagner dans cette étape
                  de votre projet
                  <br />
                </p>
              </div>
              <div class="checkbox_wrap checkbox_centre">
                <label
                  class="w-checkbox checkbox-field form12_checkbox_field"
                  on:click={handleSingleChoice}
                  ><input
                    type="checkbox"
                    id="CDC"
                    name="Written-Content-Yes"
                    data-name="Written Content Yes"
                    required=""
                    data-w-id="b0b58362-0f4c-d6cc-f71c-017ee005cd2a"
                    class="w-checkbox-input checkbox"
                  /><span
                    for="Written-Content-Yes"
                    class="checkbox-title w-form-label">Oui</span
                  ><img
                    alt=""
                    src="https://uploads-ssl.webflow.com/654fdc5ad6f9d81d70119e32/654fdc5ad6f9d81d70119e92_yes.svg"
                  /></label
                ><label
                  class="w-checkbox checkbox-field form12_checkbox_field"
                  on:click={handleSingleChoice}
                  ><input
                    type="checkbox"
                    id="NoCDC"
                    name="Written-Content-No"
                    data-name="Written Content No"
                    required=""
                    data-w-id="b0b58362-0f4c-d6cc-f71c-017ee005cd2f"
                    class="w-checkbox-input checkbox"
                  /><span
                    for="Written-Content-No"
                    class="checkbox-title w-form-label">Non</span
                  ><img
                    alt=""
                    src="https://uploads-ssl.webflow.com/654fdc5ad6f9d81d70119e32/654fdc5ad6f9d81d70119e91_no.svg"
                  /></label
                >
              </div>
            </div>
            <div class="title-left">
              <div class="text-block-3">Definition du projet</div>
            </div>
            <div class="details-right">
              <img
                alt=""
                src="https://uploads-ssl.webflow.com/654fdc5ad6f9d81d70119e32/654fdc5ad6f9d81d70119e97_3.svg"
                class="counter-image"
              />
              <div class="text-counter">3 / 6</div>
            </div>
          {/if}
          {#if activeform == 3}
            <div class="form-content">
              <div
                class="form-title-wrap"
                in:fly={{
                  delay: 0,
                  duration: 300,
                  x: 0,
                  y: 25,
                  opacity: 0,
                  easing: sineOut,
                }}
              >
                <div class="form-section-title">
                  Avez-vous un logo , un design ou une maquette ?
                </div>
                <p class="paragraph">
                  Là aussi, en fonction de votre besoin nous vous proposons un
                  service adapté<br />
                </p>
              </div>
              <div class="checkbox_wrap checkbox_centre">
                <label
                  class="w-checkbox checkbox-field form12_checkbox_field"
                  on:click={handleSingleChoice}
                  ><input
                    type="checkbox"
                    id="YesDesign"
                    name="Illustration-Yes"
                    data-name="Illustration Yes"
                    data-w-id="b0b58362-0f4c-d6cc-f71c-017ee005cd45"
                    class="w-checkbox-input checkbox"
                  /><span
                    for="Illustration-Yes"
                    class="checkbox-title w-form-label">Oui</span
                  ><img
                    alt=""
                    src="https://uploads-ssl.webflow.com/654fdc5ad6f9d81d70119e32/654fdc5ad6f9d81d70119e92_yes.svg"
                  /></label
                ><label
                  class="w-checkbox checkbox-field form12_checkbox_field"
                  on:click={handleSingleChoice}
                  ><input
                    type="checkbox"
                    id="NoDesign"
                    name="Illustration-No"
                    data-name="Illustration No"
                    data-w-id="b0b58362-0f4c-d6cc-f71c-017ee005cd4a"
                    class="w-checkbox-input checkbox"
                  /><span
                    for="Illustration-No"
                    class="checkbox-title w-form-label">Non</span
                  ><img
                    alt=""
                    src="https://uploads-ssl.webflow.com/654fdc5ad6f9d81d70119e32/654fdc5ad6f9d81d70119e91_no.svg"
                  /></label
                >
              </div>
            </div>
            <div class="details-right">
              <img
                alt=""
                src="https://uploads-ssl.webflow.com/654fdc5ad6f9d81d70119e32/654fdc5ad6f9d81d70119e96_4.svg"
                class="counter-image"
              />
              <div class="text-counter">4 / 6</div>
            </div>
            <div class="title-left">
              <div class="text-block-3">Illustrations &amp; design</div>
            </div>
          {/if}
          {#if activeform == 4}
            <div
              class="form-content"
              in:fly={{
                delay: 0,
                duration: 300,
                x: 0,
                y: 25,
                opacity: 0,
                easing: sineOut,
              }}
            >
              <div class="form-title-wrap">
                <div class="form-section-title">Votre première estimation?</div>
              </div>
              <div class="checkbox_wrap">
                <label
                  class="w-checkbox checkbox-field form12_checkbox_field"
                  on:click={handleSingleChoice}
                  ><input
                    type="checkbox"
                    id="1000+"
                    name="5000-10000"
                    data-name="5000-10000"
                    data-w-id="b0b58362-0f4c-d6cc-f71c-017ee005cd5f"
                    class="w-checkbox-input checkbox"
                  /><img
                    width="60"
                    src="https://uploads-ssl.webflow.com/654fdc5ad6f9d81d70119e32/654fdc5ad6f9d81d70119e9d_icon%2002.svg"
                    alt=""
                    class="checkbox-image"
                  /><span for="5000-10000" class="checkbox-title w-form-label"
                    >1,000€ - 2500€</span
                  ></label
                ><label
                  class="w-checkbox checkbox-field form12_checkbox_field"
                  on:click={handleSingleChoice}
                  ><input
                    type="checkbox"
                    id="2500+"
                    name="10000-20000"
                    data-name="10000-20000"
                    data-w-id="b0b58362-0f4c-d6cc-f71c-017ee005cd64"
                    class="w-checkbox-input checkbox"
                  /><img
                    width="60"
                    src="https://uploads-ssl.webflow.com/654fdc5ad6f9d81d70119e32/654fdc5ad6f9d81d70119e9c_icon%2003.svg"
                    alt=""
                    class="checkbox-image"
                  /><span for="10000-20000" class="checkbox-title w-form-label"
                    >2500€- 10000€</span
                  ></label
                ><label
                  class="w-checkbox checkbox-field form12_checkbox_field"
                  on:click={handleSingleChoice}
                  ><input
                    type="checkbox"
                    id="10000+"
                    name="20000"
                    data-name="20000+"
                    data-w-id="b0b58362-0f4c-d6cc-f71c-017ee005cd69"
                    class="w-checkbox-input checkbox"
                  /><img
                    width="60"
                    src="https://uploads-ssl.webflow.com/654fdc5ad6f9d81d70119e32/654fdc5ad6f9d81d70119e9e_icon%2004.svg"
                    alt=""
                    class="checkbox-image"
                  /><span for="20000" class="checkbox-title w-form-label"
                    >10000€- 20000€</span
                  ></label
                ><label
                  class="w-checkbox checkbox-field form12_checkbox_field"
                  on:click={handleSingleChoice}
                  ><input
                    type="checkbox"
                    id="20000+"
                    name="Support-Rate"
                    data-name="Support Rate"
                    data-w-id="b0b58362-0f4c-d6cc-f71c-017ee005cd6e"
                    class="w-checkbox-input checkbox"
                  /><img
                    width="60"
                    src="https://uploads-ssl.webflow.com/654fdc5ad6f9d81d70119e32/654fdc5ad6f9d81d70119ea0_icon%2005.svg"
                    alt=""
                    class="checkbox-image"
                  /><span for="Support-Rate" class="checkbox-title w-form-label"
                    >$20000 +</span
                  ></label
                >
              </div>
            </div>
            <div class="title-left">
              <div class="text-block-3">Type de projet</div>
            </div>
            <div class="details-right">
              <img
                alt=""
                src="https://uploads-ssl.webflow.com/654fdc5ad6f9d81d70119e32/654fdc5ad6f9d81d70119e98_5.svg"
                class="counter-image"
              />
              <div class="text-counter">5 / 6</div>
            </div>
          {/if}
          {#if activeform == 5}
            <div
              class="form-title-wrap"
              in:fly={{
                delay: 0,
                duration: 300,
                x: 0,
                y: 25,
                opacity: 0,
                easing: sineOut,
              }}
            >
              <div class="form-section-title">Confirmer la demande.</div>
              <p class="paragraph">
                Vous pouvez télecharger ici un ou plusieurs fichiers complémentaires<br
                />
              </p>
              
              <label class="button-5 w-file-upload-label">
                <div class="icon-2 w-icon-file-upload-icon" />
                <input
                  style="display:none"
                  bind:this={fileInput}
                  on:input={(e) => handleFileUpload(e)}
                  type="file"
                  id="file"
                  multiple
                />
                <div class="text w-inline-block">Téchargez votre fichier</div>
                
              </label>
              <p class="paragraph">
                {#each pdf as item, idx}
                 {idx} - {item} 
               
                {/each}
              </p>
            </div>
            <div class="title-left">
              <div class="text-block-3">Confirmation</div>
            </div>
            <div class="details-right">
              <img
                alt=""
                src="https://uploads-ssl.webflow.com/654fdc5ad6f9d81d70119e32/654fdc5ad6f9d81d70119e95_6.svg"
                class="counter-image"
              />
              <div class="text-counter">6 / 6</div>
            </div>
            <div class="form-wrap-full">
              
              <div class="field-title">
                Mettez votre e-mail pour vous faire contacter
              </div>
              <input
                type="email"
                class="field-input w-input"
                maxlength="256"
                name="Email"
                data-name="Email"
                placeholder="nomemail@email.com"
                id="Email"
                bind:value={Answers.email}
              />
            </div>
          {/if}
         
        </div>
        <div class="previous w-slider-arrow-left"  on:click={previous}>
          <img
            alt=""
            src="https://uploads-ssl.webflow.com/654fdc5ad6f9d81d70119e32/654fdc5ad6f9d81d70119e8f_arrow.svg"
            class="arrow"
          />
          <div class="previous-button" >Précédent</div>
        </div>
      {#if activeform != 5}
        <div class="next w-slider-arrow-right" on:click={next}>
          <div class="next-button" >Suivant</div>
        </div>
      {/if}
      {#if activeform == 5}
          {#if issent == false}
              <div class="next w-slider-arrow-right" on:click={handleDataUpload}>
                  <div class="next-button">Envoyer</div>
              </div>
          {:else}
              <div class="next w-slider-arrow-right">
                  <div class="next-button">en cours ...</div>
              </div>
          {/if}
        {/if}
        </div>
        
    </div>

    <div class="success-message w-form-done">
      <div>
        Thanks! I have received your form submission, I&#x27;ll get back to you
        shortly!
      </div>
    </div>
    <div class="error-message w-form-fail">
      <div>Oops! Something went wrong while submitting the form</div>
    </div>
  </div>
{:else}
  <div class="form-wrapper w-form">
    <div class="mask w-slider-mask">
       <div class="slide w-slide" style="transform: translateX(0px); opacity: 1;">
          <div class="slider-content-wrap">
             <div class="form-content" style="opacity: 1; transform: translate3d(0px, 0px, 0px) scale3d(1, 1, 1) rotateX(0deg) rotateY(0deg) rotateZ(0deg) skew(0deg, 0deg); transform-style: preserve-3d;">
                <div class="form-title-wrap">
                   <div class="form-section-title">Merci !</div>
                   <p class="paragraph">Nous vous contacterons dans les plus brefs délais !</p>
                </div>
             </div>
          </div>
       </div>
    </div>
 </div>
{/if}

<style>
  .w-slider,
  .w-slide {
    height: auto;
  }
  .slide.w-slide {
    padding-bottom: 100px; /* Espace pour les boutons */
  }
  .next.w-slider-arrow-right {
    top: auto;
    bottom: 40px;
    right: 40px;
    left: auto;
  }
  .previous.w-slider-arrow-left {
    top: auto;
    bottom: 40px;
    left: 40px;
    right: auto;
  }
</style>
