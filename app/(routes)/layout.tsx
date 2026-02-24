function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <main className="w-full min-h-screen flex flex-col">{children}</main>;
}
export default AppLayout;
