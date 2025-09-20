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
    projectDetails: null,
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
      const files = fileInput?.files || [];
      
      for (let i = 0; i < files.length; i++) {
        const f = files[i];
        if (f) {
          // Vérifier le type de fichier
          const allowedTypes = [
            'application/pdf',
            'image/jpeg',
            'image/jpg', 
            'image/png',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
          ];
          
          if (!allowedTypes.includes(f.type)) {
            throw new Error('Seuls les fichiers PDF, JPEG, PNG et DOC sont acceptés.');
          }
          
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
    let newPdfs = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      console.log(`Uploading file: ${file.name}, size: ${file.size} bytes`);
      
      // Vérifier le type de fichier
      const allowedTypes = [
        'application/pdf',
        'image/jpeg',
        'image/jpg', 
        'image/png',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ];
      
      if (!allowedTypes.includes(file.type)) {
        throw new Error('Seuls les fichiers PDF, JPEG, PNG et DOC sont acceptés.');
      }
      
      formData.append('pdfs[]', file, file.name);
      newPdfs.push(file.name);
    }
    
    // Ajouter les nouveaux fichiers à la liste existante
    pdf = [...pdf, ...newPdfs];
    console.log('Total files:', pdf);
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
      backgroundColor: "rgba(54, 179, 126, 0.1)",
      transform:
        "translate3d(0px, 0px, 0px) scale3d(1.05, 1.05, 1) rotateX(0deg) rotateY(0deg) rotateZ(0deg) skew(0deg)",
      borderColor: "rgb(54, 179, 126)",
      transformStyle: "preserve-3d",
    };
    const initialStyle = {
      backgroundColor: "rgba(255, 255, 255, 0.05)",
      transform:
        "translate3d(0px, 0px, 0px) scale3d(1.0, 1.0, 1) rotateX(0deg) rotateY(0deg) rotateZ(0deg) skew(0deg)",
      borderColor: "rgba(255, 255, 255, 0.2)",
      transformStyle: "preserve-3d",
    };

    return {
      duration,
      css: (t, u) => {
        const eased = elasticOut(t);
        
        const progress = isScalingIn ? eased : 1 - eased;
        
        const scale = 1 + 0.05 * progress;

        const lerp = (start, end, t) => start * (1 - t) + end * t;

        const borderColorStart = { r: 255, g: 255, b: 255, a: 0.2 };
        const borderColorEnd = { r: 54, g: 179, b: 126, a: 1 };
        const backgroundColorStart = { r: 255, g: 255, b: 255, a: 0.05 };
        const backgroundColorEnd = { r: 54, g: 179, b: 126, a: 0.1 };

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

        const backgroundColor = `rgba(${~~lerp(
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
        )}, ${lerp(backgroundColorStart.a, backgroundColorEnd.a, progress)})`;

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
    
    // Force le background sombre pour la section "Que recherchez-vous ?"
    const formContent = document.querySelector('.form-content-dark');
    if (formContent) {
      formContent.style.background = 'linear-gradient(135deg, rgba(10, 10, 10, 0.9) 0%, rgba(20, 20, 20, 0.8) 100%)';
      formContent.style.border = '1px solid rgba(255, 255, 255, 0.15)';
      formContent.style.backdropFilter = 'blur(15px)';
      formContent.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.4)';
    }
  });

  $: if (isSuccess) {
    setTimeout(() => {
      window.location.href = "/";
    }, 5000);
  }
</script>

{#if !isSuccess}
  <div class="form-wrapper-dark w-form">
    <div class="mask w-slider-mask">
      <div data-w-id="b0b58362-0f4c-d6cc-f71c-017ee005ccd8" class="slide w-slide">
        <div class="slider-content-wrap">
          {#if activeform == 0}
            <div
              class="form-content-dark"
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
                <div class="form-section-title-dark">Que recherchez-vous ?</div>
              </div>
              <div class="checkbox_wrap">
                <label
                  class="w-checkbox checkbox-field-dark form12_checkbox_field"
                  on:click={animatecheckbox}
                  ><input
                    type="checkbox"
                    id="Site Vitrine"
                    name="Site Vitrine"
                    data-name="web design"
                    data-w-id="b0b58362-0f4c-d6cc-f71c-017ee005cce2"
                    class="w-checkbox-input checkbox"
                  /><img
                    width="60"
                    src="https://uploads-ssl.webflow.com/654fdc5ad6f9d81d70119e32/654fdc5ad6f9d81d70119ea1_icon%2001.svg"
                    alt=""
                    class="checkbox-image"
                  /><span for="design" class="checkbox-title-dark w-form-label"
                    >Site Vitrine</span
                  ></label
                ><label
                  class="w-checkbox checkbox-field-dark form12_checkbox_field"
                  on:click={animatecheckbox}
                  ><input
                    type="checkbox"
                    id="Application Web"
                    name="Application Web"
                    data-name="Application Web"
                    data-w-id="b0b58362-0f4c-d6cc-f71c-017ee005cce9"
                    class="w-checkbox-input checkbox"
                  /><img
                    width="60"
                    src="https://uploads-ssl.webflow.com/654fdc5ad6f9d81d70119e32/654fdc5ad6f9d81d70119e9e_icon%2004.svg"
                    alt=""
                    class="checkbox-image"
                  /><span for="Webflow-Build" class="checkbox-title-dark w-form-label"
                    >Application Web</span
                  ></label
                ><label
                  class="w-checkbox checkbox-field-dark form12_checkbox_field"
                  on:click={animatecheckbox}
                  ><input
                    type="checkbox"
                    id="Application Mobile"
                    name="Application Mobile"
                    data-name="Application Mobile"
                    data-w-id="b0b58362-0f4c-d6cc-f71c-017ee005ccf0"
                    class="w-checkbox-input checkbox"
                  /><img
                    width="60"
                    src="https://uploads-ssl.webflow.com/654fdc5ad6f9d81d70119e32/654fdc5ad6f9d81d70119e9c_icon%2003.svg"
                    alt=""
                    class="checkbox-image"
                  /><span
                    for="Webflow-Support"
                    class="checkbox-title-dark w-form-label"
                    >Application Mobile</span
                  ></label
                ><label
                  class="w-checkbox checkbox-field-dark form12_checkbox_field"
                  on:click={animatecheckbox}
                  ><input
                    type="checkbox"
                    id="E-commerce"
                    name="E-commerce"
                    data-name="E-commerce"
                    data-w-id="b0b58362-0f4c-d6cc-f71c-017ee005ccf7"
                    class="w-checkbox-input checkbox"
                  /><img
                    width="60"
                    src="https://uploads-ssl.webflow.com/654fdc5ad6f9d81d70119e32/654fdc5ad6f9d81d70119e9e_icon%2004.svg"
                    alt=""
                    class="checkbox-image"
                  /><span for="Other" class="checkbox-title-dark w-form-label"
                    >E-commerce</span
                  ></label
                >
              </div>
            </div>
            <div class="title-left-dark">
              <div class="text-block-3-dark">Formulaire</div>
            </div>
            <div class="details-right-dark">
              <img
                alt=""
                src="https://uploads-ssl.webflow.com/654fdc5ad6f9d81d70119e32/654fdc5ad6f9d81d70119e9a_1.svg"
                class="counter-image"
              />
              <div class="text-counter-dark">1 / 6</div>
            </div>
          {/if}
          {#if activeform == 1}
            <div
              class="form-content-dark"
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
                <div class="form-section-title-dark">
                  Nous sommes impatients de vous rencontrer.
                </div>
                <p class="paragraph-dark">
                  Vos informations sont bien gardée! Remplissez la suite de ce
                  formulaire pour que l'on puisse mieux comprendre les besoins de
                  votre projet<br />
                </p>
              </div>
              <div class="form-wrap-full">
                <div class="form-wrap">
                  <div class="field-title-dark">Votre nom</div>
                  <input
                    type="text"
                    class="field-input-dark w-input"
                    maxlength="256"
                    name="Customers-Name"
                    data-name="Customers Name"
                    placeholder=""
                    id="Customers-Name"
                    bind:value={Answers.firstname}
                  />
                </div>
                <div class="form-wrap">
                  <div class="field-title-dark">Votre prénom</div>
                  <input
                    type="text"
                    class="field-input-dark w-input"
                    maxlength="256"
                    name="Customers-Name-4"
                    data-name="Customers Name 4"
                    placeholder=""
                    id="Customers-Name-4"
                    bind:value={Answers.lastname}
                  />
                </div>
                <div class="form-wrap">
                  <div class="field-title-dark">
                    Votre numéro de téléphone (optionnel)
                  </div>
                  <input
                    class="field-input-dark w-input"
                    name="Customers-Name-3"
                    data-name="Customers Name 3"
                    placeholder="(+33)"
                    id="Customers-Name-3"
                    bind:value={Answers.phone}
                  />
                </div>
              </div>
            </div>

            <div class="title-left-dark">
              <div class="text-block-3-dark">Coordonnées</div>
            </div>
            <div class="details-right-dark">
              <img
                alt=""
                src="https://uploads-ssl.webflow.com/654fdc5ad6f9d81d70119e32/654fdc5ad6f9d81d70119e99_2.svg"
                class="counter-image"
              />
              <div class="text-counter-dark">2 / 6</div>
            </div>
          {/if}
          {#if activeform == 2}
            <div class="form-content-dark">
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
                <div class="form-section-title-dark">
                  Avez-vous établit un cahier des charges?
                </div>
                <p class="paragraph-dark">
                  Pas d'inquiétude! Nous pouvons vous accompagner dans cette étape
                  de votre projet
                  <br />
                </p>
              </div>
              <div class="checkbox_wrap checkbox_centre">
                <label
                  class="w-checkbox checkbox-field-dark form12_checkbox_field"
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
                    class="checkbox-title-dark w-form-label">Oui</span
                  ><img
                    alt=""
                    src="https://uploads-ssl.webflow.com/654fdc5ad6f9d81d70119e32/654fdc5ad6f9d81d70119e92_yes.svg"
                  /></label
                ><label
                  class="w-checkbox checkbox-field-dark form12_checkbox_field"
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
                    class="checkbox-title-dark w-form-label">Non</span
                  ><img
                    alt=""
                    src="https://uploads-ssl.webflow.com/654fdc5ad6f9d81d70119e32/654fdc5ad6f9d81d70119e91_no.svg"
                  /></label
                >
              </div>
            </div>
            <div class="title-left-dark">
              <div class="text-block-3-dark">Definition du projet</div>
            </div>
            <div class="details-right-dark">
              <img
                alt=""
                src="https://uploads-ssl.webflow.com/654fdc5ad6f9d81d70119e32/654fdc5ad6f9d81d70119e97_3.svg"
                class="counter-image"
              />
              <div class="text-counter-dark">3 / 6</div>
            </div>
          {/if}
          {#if activeform == 3}
            <div class="form-content-dark">
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
                <div class="form-section-title-dark">
                  Avez-vous un logo , un design ou une maquette ?
                </div>
                <p class="paragraph-dark">
                  Là aussi, en fonction de votre besoin nous vous proposons un
                  service adapté<br />
                </p>
              </div>
              <div class="checkbox_wrap checkbox_centre">
                <label
                  class="w-checkbox checkbox-field-dark form12_checkbox_field"
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
                    class="checkbox-title-dark w-form-label">Oui</span
                  ><img
                    alt=""
                    src="https://uploads-ssl.webflow.com/654fdc5ad6f9d81d70119e32/654fdc5ad6f9d81d70119e92_yes.svg"
                  /></label
                ><label
                  class="w-checkbox checkbox-field-dark form12_checkbox_field"
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
                    class="checkbox-title-dark w-form-label">Non</span
                  ><img
                    alt=""
                    src="https://uploads-ssl.webflow.com/654fdc5ad6f9d81d70119e32/654fdc5ad6f9d81d70119e91_no.svg"
                  /></label
                >
              </div>
            </div>
            <div class="details-right-dark">
              <img
                alt=""
                src="https://uploads-ssl.webflow.com/654fdc5ad6f9d81d70119e32/654fdc5ad6f9d81d70119e96_4.svg"
                class="counter-image"
              />
              <div class="text-counter-dark">4 / 6</div>
            </div>
            <div class="title-left-dark">
              <div class="text-block-3-dark">Illustrations &amp; design</div>
            </div>
          {/if}
          {#if activeform == 4}
            <div
              class="form-content-dark"
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
                <div class="form-section-title-dark">Votre première estimation?</div>
              </div>
              <div class="checkbox_wrap">
                <label
                  class="w-checkbox checkbox-field-dark form12_checkbox_field"
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
                  /><span for="5000-10000" class="checkbox-title-dark w-form-label"
                    >500€ - 2500€</span
                  ></label
                ><label
                  class="w-checkbox checkbox-field-dark form12_checkbox_field"
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
                  /><span for="10000-20000" class="checkbox-title-dark w-form-label"
                    >2500€- 10000€</span
                  ></label
                ><label
                  class="w-checkbox checkbox-field-dark form12_checkbox_field"
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
                  /><span for="20000" class="checkbox-title-dark w-form-label"
                    >10000€- 20000€</span
                  ></label
                ><label
                  class="w-checkbox checkbox-field-dark form12_checkbox_field"
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
                  /><span for="Support-Rate" class="checkbox-title-dark w-form-label"
                    >$20000 +</span
                  ></label
                >
              </div>
            </div>
            <div class="title-left-dark">
              <div class="text-block-3-dark">Type de projet</div>
            </div>
            <div class="details-right-dark">
              <img
                alt=""
                src="https://uploads-ssl.webflow.com/654fdc5ad6f9d81d70119e32/654fdc5ad6f9d81d70119e98_5.svg"
                class="counter-image"
              />
              <div class="text-counter-dark">5 / 6</div>
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
              <div class="form-section-title-dark">Confirmer la demande.</div>
              <p class="paragraph-dark">
                Vous pouvez télécharger ici un ou plusieurs fichiers complémentaires (PDF, JPEG, PNG, DOC)<br />
                <strong>Maximum : 5000 KO au total</strong><br
                />
              </p>
              
              <label class="button-5-dark w-file-upload-label">
                <div class="icon-2 w-icon-file-upload-icon" />
                <input
                  style="display:none"
                  bind:this={fileInput}
                  on:input={(e) => handleFileUpload(e)}
                  type="file"
                  id="file"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                />
                <div class="text w-inline-block">Téléchargez votre fichier (PDF, JPEG, PNG, DOC)</div>
                
              </label>
              <p class="paragraph-dark">
                {#each pdf as item, idx}
                 {idx} - {item} 
               
                {/each}
              </p>
              
              <div class="form-wrap-full">
                <div class="field-title-dark">
                  Détaillez plus votre projet (optionnel)
                </div>
                <textarea
                  class="field-input-dark w-input"
                  maxlength="1000"
                  name="Project-Details"
                  data-name="Project Details"
                  placeholder="Décrivez votre projet en quelques mots..."
                  id="Project-Details"
                  rows="4"
                  bind:value={Answers.projectDetails}
                ></textarea>
              </div>
            </div>
            <div class="title-left-dark">
              <div class="text-block-3-dark">Confirmation</div>
            </div>
            <div class="details-right-dark">
              <img
                alt=""
                src="https://uploads-ssl.webflow.com/654fdc5ad6f9d81d70119e32/654fdc5ad6f9d81d70119e95_6.svg"
                class="counter-image"
              />
              <div class="text-counter-dark">6 / 6</div>
            </div>
            <div class="form-wrap-full">
              
              <div class="field-title-dark">
                Mettez votre e-mail pour vous faire contacter
              </div>
              <input
                type="email"
                class="field-input-dark w-input"
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
        <!-- Nouvelle barre de navigation propre -->
        <div class="nav-bar-clean">
          <button class="nav-btn nav-prev" on:click={previous}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="15,18 9,12 15,6"></polyline>
            </svg>
            Précédent
          </button>
          
          <div class="nav-counter">
            {activeform + 1} / 6
          </div>
          
          {#if activeform != 5}
            <button class="nav-btn nav-next" on:click={next}>
              Suivant
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="9,18 15,12 9,6"></polyline>
              </svg>
            </button>
          {/if}
          {#if activeform == 5}
            {#if issent == false}
              <button class="nav-btn nav-send" on:click={handleDataUpload}>
                Envoyer
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="22" y1="2" x2="11" y2="13"></line>
                  <polygon points="22,2 15,22 11,13 2,9 22,2"></polygon>
                </svg>
              </button>
            {:else}
              <button class="nav-btn nav-send" disabled>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12,6 12,12 16,14"></polyline>
                </svg>
                En cours...
              </button>
            {/if}
          {/if}
        </div>
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
  <div class="form-wrapper-dark w-form">
    <div class="mask w-slider-mask">
       <div class="slide w-slide" style="transform: translateX(0px); opacity: 1;">
          <div class="slider-content-wrap">
             <div class="form-content-dark" style="opacity: 1; transform: translate3d(0px, 0px, 0px) scale3d(1, 1, 1) rotateX(0deg) rotateY(0deg) rotateZ(0deg) skew(0deg, 0deg); transform-style: preserve-3d;">
                <div class="form-title-wrap">
                   <div class="form-section-title-dark">Merci !</div>
                   <p class="paragraph-dark">Nous vous contacterons dans les plus brefs délais !</p>
                </div>
             </div>
          </div>
       </div>
    </div>
 </div>
{/if}

<style>
  /* Styles pour le thème sombre - avec !important pour forcer */
  :global(.body-form-dark) {
    background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 50%, #1e1e1e 100%) !important;
    color: #ffffff !important;
    min-height: 100vh !important;
  }

  /* Supprimer toutes les ombres existantes */
  :global(.form-wrapper-dark *),
  :global(.checkbox-field-dark),
  :global(.form12_checkbox_field),
  :global(.w-checkbox) {
    box-shadow: none !important;
    filter: none !important;
    text-shadow: none !important;
  }

  :global(.form-full-dark) {
    background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 50%, #1e1e1e 100%) !important;
    min-height: 100vh !important;
    padding: 40px 20px !important;
  }

  :global(body.body-form-dark) {
    background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 50%, #1e1e1e 100%) !important;
    color: #ffffff !important;
  }

  :global(.form-full-dark #app) {
    background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 50%, #1e1e1e 100%) !important;
  }

  /* Force le background sombre pour la section "Que recherchez-vous ?" */
  :global(.form-content-dark) {
    background: linear-gradient(135deg, rgba(10, 10, 10, 0.9) 0%, rgba(20, 20, 20, 0.8) 100%) !important;
    border: 1px solid rgba(255, 255, 255, 0.15) !important;
    backdrop-filter: blur(15px) !important;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4) !important;
  }

  /* Forcer la visibilité des boutons */
  :global(.form-full-dark),
  :global(.form-full-dark *),
  :global(.w-slider),
  :global(.w-slide),
  :global(.w-slider-mask) {
    overflow: visible !important;
  }

  :global(.previous-dark),
  :global(.next-dark) {
    z-index: 1000 !important;
    position: absolute !important;
  }

  .form-wrapper-dark {
    max-width: 1200px;
    margin: 0 auto;
    background: transparent !important;
    border-radius: 20px;
    padding: 60px 40px 120px 40px; /* Beaucoup plus d'espace en bas */
    border: none !important;
    backdrop-filter: none !important;
    position: relative;
    min-height: 100vh; /* Hauteur minimale */
    overflow: visible !important; /* Forcer la visibilité */
  }

  .form-content-dark {
    background: linear-gradient(135deg, rgba(10, 10, 10, 0.9) 0%, rgba(20, 20, 20, 0.8) 100%) !important;
    border-radius: 16px;
    padding: 40px;
    border: 1px solid rgba(255, 255, 255, 0.15) !important;
    margin-bottom: 40px;
    backdrop-filter: blur(15px) !important;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4) !important;
  }

  .form-section-title-dark {
    font-size: 2.5rem;
    font-weight: 700;
    color: #ffffff;
    margin-bottom: 20px;
    text-align: center;
    background: linear-gradient(135deg, #36b37e 0%, #00d4aa 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .paragraph-dark {
    color: rgba(255, 255, 255, 0.8);
    font-size: 1.1rem;
    line-height: 1.6;
    text-align: center;
    margin-bottom: 30px;
  }

  .checkbox-field-dark {
    background: linear-gradient(135deg, rgba(40, 40, 40, 0.7) 0%, rgba(60, 60, 60, 0.5) 100%);
    border: 2px solid rgba(255, 255, 255, 0.25);
    border-radius: 12px;
    padding: 20px;
    margin: 10px;
    transition: all 0.3s ease;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    min-height: 180px;
    justify-content: center;
    backdrop-filter: blur(8px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  }

  .checkbox-field-dark:hover {
    background: linear-gradient(135deg, rgba(50, 50, 50, 0.8) 0%, rgba(70, 70, 70, 0.6) 100%);
    border-color: rgba(54, 179, 126, 0.6);
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25);
  }

  .checkbox_wrap {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    justify-content: center;
  }

  .checkbox-title-dark {
    color: #ffffff;
    font-size: 1.1rem;
    font-weight: 600;
    margin-top: 15px;
    line-height: 1.4;
  }

  .field-title-dark {
    color: #ffffff;
    font-size: 1.1rem;
    font-weight: 600;
    margin-bottom: 10px;
  }

  .field-input-dark {
    background: rgba(255, 255, 255, 0.05);
    border: 2px solid rgba(255, 255, 255, 0.2);
    border-radius: 8px;
    padding: 15px 20px;
    color: #ffffff;
    font-size: 1rem;
    width: 100%;
    transition: all 0.3s ease;
  }

  .field-input-dark:focus {
    outline: none;
    border-color: #36b37e;
    background: rgba(255, 255, 255, 0.08);
    box-shadow: 0 0 0 3px rgba(54, 179, 126, 0.1);
  }

  .field-input-dark::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }

  textarea.field-input-dark {
    min-height: 100px;
    resize: vertical;
    font-family: inherit;
  }

  .title-left-dark {
    position: absolute;
    top: 40px;
    left: 40px;
  }

  .text-block-3-dark {
    color: rgba(255, 255, 255, 0.6);
    font-size: 0.9rem;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  .details-right-dark {
    position: absolute;
    top: 40px;
    right: 40px;
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .text-counter-dark {
    color: #36b37e;
    font-size: 1.2rem;
    font-weight: 700;
  }

  /* Nouvelle barre de navigation propre */
  .nav-bar-clean {
    position: absolute;
    bottom: 40px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    align-items: center;
    gap: 20px;
    background: rgba(0, 0, 0, 0.8);
    padding: 15px 25px;
    border-radius: 50px;
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    z-index: 1000;
  }

  .nav-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 20px;
    border: none;
    border-radius: 25px;
    font-size: 0.9rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    background: transparent;
    color: rgba(255, 255, 255, 0.8);
  }

  .nav-btn:hover {
    background: rgba(255, 255, 255, 0.1);
    color: #ffffff;
    transform: translateY(-2px);
  }

  .nav-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .nav-next,
  .nav-send {
    background: linear-gradient(135deg, #36b37e 0%, #00d4aa 100%);
    color: #ffffff;
  }

  .nav-next:hover,
  .nav-send:hover {
    background: linear-gradient(135deg, #2d9a6b 0%, #00b894 100%);
    box-shadow: 0 8px 25px rgba(54, 179, 126, 0.3);
  }

  .nav-counter {
    color: #36b37e;
    font-size: 1.1rem;
    font-weight: 700;
    padding: 0 10px;
  }

  .button-5-dark {
    background: rgba(255, 255, 255, 0.05);
    border: 2px dashed rgba(255, 255, 255, 0.3);
    border-radius: 8px;
    padding: 20px;
    display: flex;
    align-items: center;
    gap: 10px;
    cursor: pointer;
    transition: all 0.3s ease;
    margin: 20px 0;
  }

  .button-5-dark:hover {
    background: rgba(255, 255, 255, 0.08);
    border-color: #36b37e;
  }

  .button-5-dark .text {
    color: #ffffff;
    font-weight: 500;
  }

  .w-slider,
  .w-slide {
    height: auto;
  }
  .slide.w-slide {
    padding-bottom: 150px; /* Beaucoup plus d'espace pour les boutons */
    min-height: 80vh; /* Hauteur minimale pour chaque slide */
  }

  /* Responsive */
  @media (max-width: 768px) {
    .form-wrapper-dark {
      padding: 30px 15px;
      margin: 0;
    }
    
    .form-content-dark {
      padding: 20px 15px;
    }
    
    .form-section-title-dark {
      font-size: 2rem;
    }
    
    .title-left-dark,
    .details-right-dark {
      position: static;
      margin-bottom: 20px;
    }
    
    /* Mobile: Barre de navigation adaptée */
    .nav-bar-clean {
      position: fixed;
      bottom: 20px;
      left: 20px;
      right: 20px;
      transform: none;
      padding: 12px 15px;
      gap: 10px;
      justify-content: space-between;
    }

    .nav-btn {
      padding: 10px 16px;
      font-size: 0.8rem;
    }

    .nav-counter {
      font-size: 1rem;
    }

    /* Mobile: 2 options par ligne minimum */
    .checkbox_wrap {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 15px;
      justify-items: center;
    }

    .checkbox-field-dark {
      width: 100%;
      max-width: 200px;
      min-height: 160px;
      margin: 0;
    }

    /* Mobile: Monter la section "Que recherchez-vous ?" */
    .form-content-dark {
      margin-top: -120px;
    }
  }
</style>
