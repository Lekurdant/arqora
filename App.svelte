<script>
     import Notifications from 'svelte-notifications';
     import Form from './form.svelte';
     import Projet from './projet.svelte';

     // Détecter si on est sur la page projet
     const isProjetPage = window.location.pathname.includes('projet') || 
                         document.body.classList.contains('body-form-dark');
</script>

<Notifications>
    {#if isProjetPage}
        <Projet />
    {:else}
        <Form />
    {/if}
</Notifications>