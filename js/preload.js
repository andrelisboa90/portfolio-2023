        document.addEventListener('DOMContentLoaded', function () {
            const loader = document.getElementById('page-loader');
            const body = document.body;

            if (!loader) return;

            // Remove a classe de loading para liberar as animações da página
            body.classList.remove('is-loading');
            loader.classList.add('is-hidden');

            setTimeout(function () {
                loader.remove();
            }, 450);
        });