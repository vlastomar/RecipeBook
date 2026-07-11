export function renderFooter() {
  const footer = document.querySelector('[data-footer]');
  if (!footer) return;

  footer.innerHTML = `
    <footer class="bg-dark text-white py-4 mt-5">
      <div class="container text-center">
        <p class="mb-0">&copy; 2026 ReceiptBook. Starter scaffold.</p>
      </div>
    </footer>
  `;
}
