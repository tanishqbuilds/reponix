import Link from "next/link"
import { Github } from "lucide-react"
import Image from "next/image"

export function Footer() {
  return (
    <footer className="py-12 px-4 border-t border-border">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md overflow-hidden flex items-center justify-center">
              <Image
                src="/logo.png"
                alt="Reponix Logo"
                width={32}
                height={32}
                className="object-cover"
              />
            </div>
            <span className="font-semibold text-foreground">Reponix</span>
          </div>

          {/* Links */}
          <nav className="flex items-center gap-8">
            <Link
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <Github className="w-4 h-4" />
              GitHub
            </Link>
            <Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              About
            </Link>
            <Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Contact
            </Link>
          </nav>

          {/* Copyright */}
          <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} Reponix. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
