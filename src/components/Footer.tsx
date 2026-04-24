export const Footer = () => {
  const legalLinks = [
    { url: 'https://raynsecure.com/master-services-agreement', label: 'Master Services Agreement' },
    { url: 'https://raynsecure.com/terms-conditions', label: 'Terms & Conditions' },
    { url: 'https://raynsecure.com/data-protection-policy', label: 'Data Protection Policy' },
    { url: 'https://raynsecure.com/privacy-policy', label: 'Privacy Policy' },
  ];

  return (
    <footer className="bg-learning-surface border-t border-learning-border mt-auto">
      <div className="max-w-6xl mx-auto px-6 py-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} RAYN Secure Pte Ltd. All rights reserved.
          </div>
          <nav className="flex flex-wrap justify-center gap-4 md:gap-6">
            {legalLinks.map((link) => (
              <a
                key={link.url}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-muted-foreground hover:text-learning-primary transition-colors"
              >
                {link.label}
              </a>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
};
