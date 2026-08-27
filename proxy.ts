import { NextRequest, NextResponse } from "next/server";

export function proxy(request: NextRequest) {
  if (!request.nextUrl.pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  const adminUser = process.env.ADMIN_USER;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminUser || !adminPassword) {
    return new NextResponse("El acceso de administración todavía no está configurado.", {
      status: 503,
    });
  }

  const authorization = request.headers.get("authorization");

  if (authorization?.startsWith("Basic ")) {
    try {
      const decoded = atob(authorization.slice(6));
      const separatorIndex = decoded.indexOf(":");
      const suppliedUser = separatorIndex >= 0 ? decoded.slice(0, separatorIndex) : decoded;
      const suppliedPassword = separatorIndex >= 0 ? decoded.slice(separatorIndex + 1) : "";

      if (suppliedUser === adminUser && suppliedPassword === adminPassword) {
        return NextResponse.next();
      }
    } catch {
      // Fall through to the authentication challenge below.
    }
  }

  return new NextResponse("Autenticación requerida.", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="CertificadoEnCasa Admin", charset="UTF-8"',
    },
  });
}

export const config = {
  matcher: ["/admin/:path*"],
};
