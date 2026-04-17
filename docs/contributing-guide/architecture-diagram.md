---
id: architecture-diagram
title: Miru System Architecture Diagram
description: Current high-level architecture diagram for miru-web and its core integrations.
sidebar_position: 8
---

This page contains the current high-level architecture diagram for `miru-web`.

- Open the standalone diagram: [`/files/architecture/miru-web-architecture.html`](/files/architecture/miru-web-architecture.html)
- Preview image:

![Miru system architecture diagram](/img/architecture/miru-web-architecture.png)

## Scope

The diagram reflects the observed repository stack and deployment shape:

- Rails backend and React plus Vite frontend
- PostgreSQL primary data store
- Solid Queue background processing
- Redis cache and messaging support
- Active Storage object uploads
- Stripe payment integration
- Email delivery path

## Regeneration Notes

The diagram was generated from the installed `architecture-diagram` skill and then tailored to the current `miru-web` codebase and runtime layout.
