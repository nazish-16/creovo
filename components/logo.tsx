import Link from "next/link";

const Logo = () => {
  return (
    <Link href="/" className="flex-1 flex items-center gap-2 text-2xl">
      <img src="/assets/creovoblack.png" alt="Creovo Logo" className="size-8 object-contain dark:hidden" />
      <img src="/assets/creovo.png" alt="Creovo Logo" className="size-8 object-contain hidden dark:block" />
      <span className="font-bold text-foreground">Creovo</span>
    </Link>
  );
};

export default Logo;
