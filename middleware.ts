import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
    // const url = req.nextUrl;
    // const hostname = req.headers.get("host") || "";
    // const domainParts = hostname.split('.');
    // const subdomain = domainParts.length > 1 ? domainParts[0] : null;

    // // DEV-режим: для localhost дозволяємо /login та /app на тому ж домені,
    // // щоб уникнути проблем із SameSite та куками
    // if (hostname.startsWith("localhost")) {
    //     return NextResponse.next();
    // }

    // if (hostname.startsWith("login.")) {
    //     url.pathname = `/login${url.pathname}`;
    //     return NextResponse.rewrite(url);
    // }

    // if (hostname.startsWith("app.")) {
    //     url.pathname = `/app${url.pathname}`;
    //     return NextResponse.rewrite(url);
    // }

    // if (subdomain && !['app', 'login'].includes(subdomain)) {
    //     return NextResponse.rewrite(new URL("/404", req.url));
    // }

    // if (url.pathname.startsWith("/app") || url.pathname.startsWith("/login")) {
    //     return NextResponse.rewrite(new URL("/404", req.url));
    // }

    return NextResponse.next();
}

export const config = {
    matcher: ["/((?!_next|api).*)"],
};
