            const header = document.querySelector('header');
            const scrollThreshold = 64; // Valor exato da sua margin-top inicial em pixels

            window.addEventListener('scroll', () => {
                // Se rolar mais do que a margem inicial (64px), ativa o sticky estilo novo.
                // Quando voltar a ser menor que 64px, remove a classe e volta ao original.
                if (window.scrollY > scrollThreshold) {
                header.classList.add('is-sticky');
                } else {
                header.classList.remove('is-sticky');
                }
            });