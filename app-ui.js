(function (global) {
    const AppUI = {
        // Installs the specific header for the page: Dashboard or Rutas
        installHeader: function (title) {
            // This function is called but we can leave it empty or 
            // implement minimal logic if the header is already in HTML.
            // The HTML already has a header, this might just update the title.
            try {
                const h1 = document.querySelector('header h1');
                if (h1 && title) h1.textContent = title;
            } catch (e) { }
        },

        // Utility to fix text encoding issues if any
        textFixAll: function (root) {
            if (!root) return;
            // No-op for now unless we see encoding bugs
        }
    };

    global.AppUI = AppUI;
})(window);
