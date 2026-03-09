export default function HelpCenterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // The help center has its own custom navigation and layout,
  // so we override the parent public layout's wrapper styling.
  // We use a full-screen container that breaks out of the parent layout.
  return (
    <div className="fixed inset-0 z-[100] bg-[#0A0A0A] overflow-auto">
      {children}
    </div>
  );
}
