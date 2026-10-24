/* global HTMLCanvasElement */
import React, { useEffect, useRef, useState } from "react";
import {
  getDocument,
  GlobalWorkerOptions,
  type PDFDocumentProxy,
  type RenderTask,
} from "pdfjs-dist";
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { PdfResources } from "./pdfResources";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { failureMessage, originalBytes, originalPath } from "./api";
import type { Field, SourceDocument } from "./types";

GlobalWorkerOptions.workerSrc = workerUrl;
const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

type Props = {
  requestId: number;
  revisionId: number;
  documents: SourceDocument[];
  fields: Field[];
  selected: string;
  preview: { document: string; page: number };
  setPreview: (value: Props["preview"]) => void;
  select: (field: Field) => void;
  change: (field: Field, patch: Partial<Field>) => void;
  editable: boolean;
};

export default function PdfPages({
  requestId,
  revisionId,
  documents,
  fields,
  selected,
  preview,
  setPreview,
  select,
  change,
  editable,
}: Props) {
  const source =
    documents.find(document => document.key === preview.document) ||
    documents[0];
  const [pdf, setPdf] = useState<PDFDocumentProxy | null>(null);
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);
  const [text, setText] = useState("");
  const [zoom, setZoom] = useState(100);
  const [width, setWidth] = useState(600);
  const [refresh, setRefresh] = useState(0);
  const container = useRef<HTMLDivElement>(null);
  const surface = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const gesture = useRef<{
    field: Field;
    x: number;
    y: number;
    resize: boolean;
  } | null>(null);
  const pageNumber = clamp(preview.page, 1, source.pages.length);
  const geometry = source.pages[pageNumber - 1];
  const rotated = geometry.rotation % 180 !== 0;
  const ratio = rotated
    ? geometry.width / geometry.height
    : geometry.height / geometry.width;

  useEffect(() => {
    const observer = new window.ResizeObserver(entries =>
      setWidth(Math.max(1, entries[0].contentRect.width))
    );
    if (container.current) observer.observe(container.current);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const controller = new window.AbortController();
    let active = true;
    let loading: ReturnType<typeof getDocument> | undefined;
    setPdf(null);
    setError("");
    setReady(false);
    originalBytes(
      originalPath(requestId, revisionId, source.key),
      controller.signal
    )
      .then(bytes => {
        if (!active) return;
        loading = getDocument({
          data: new Uint8Array(bytes),
          stopAtErrors: true,
          useSystemFonts: false,
          useWorkerFetch: false,
          BinaryDataFactory: PdfResources,
          maxImageSize: 16000000,
          canvasMaxAreaInBytes: 64 * 1024 * 1024,
        });

        return loading.promise.then(document => {
          if (active) setPdf(document);
        });
      })
      .catch(failure => {
        if (active) setError(failureMessage(failure));
      });

    return () => {
      active = false;
      controller.abort();
      void loading?.destroy();
    };
  }, [requestId, revisionId, source.key, refresh]);

  const displayWidth = (Math.min(800, width) * zoom) / 100;
  useEffect(() => {
    if (!pdf || !canvas.current) return;
    let active = true;
    let render: RenderTask | undefined;
    setReady(false);
    setText("");
    pdf
      .getPage(pageNumber)
      .then(async page => {
        if (!active || !canvas.current) return;
        const base = page.getViewport({ scale: 1 });
        const viewport = page.getViewport({ scale: displayWidth / base.width });
        const density = Math.min(window.devicePixelRatio || 1, 2);
        canvas.current.width = Math.ceil(viewport.width * density);
        canvas.current.height = Math.ceil(viewport.height * density);
        render = page.render({
          canvas: canvas.current,
          viewport,
          transform: [density, 0, 0, density, 0, 0],
        });
        const content = await page.getTextContent();
        if (active) {
          setText(
            content.items.map(item => ("str" in item ? item.str : "")).join(" ")
          );
        }
        await render.promise;
        if (active) setReady(true);
      })
      .catch(failure => {
        if (active) setError(failureMessage(failure));
      });

    return () => {
      active = false;
      render?.cancel();
    };
  }, [pdf, pageNumber, displayWidth]);

  const move = (event: React.PointerEvent<HTMLButtonElement>) => {
    const start = gesture.current;
    if (!start || !surface.current) return;
    const box = surface.current.getBoundingClientRect();
    const x = ((event.clientX - start.x) / box.width) * 100;
    const y = ((event.clientY - start.y) / box.height) * 100;
    change(
      start.field,
      start.resize
        ? {
            width: clamp(start.field.width + x, 1, 100 - start.field.x),
            height: clamp(start.field.height + y, 1, 100 - start.field.y),
          }
        : {
            x: clamp(start.field.x + x, 0, 100 - start.field.width),
            y: clamp(start.field.y + y, 0, 100 - start.field.height),
          }
    );
  };

  const keyboard = (
    event: React.KeyboardEvent<HTMLButtonElement>,
    field: Field,
    resize: boolean
  ) => {
    const directions: Record<string, [number, number]> = {
      ArrowLeft: [-1, 0],
      ArrowRight: [1, 0],
      ArrowUp: [0, -1],
      ArrowDown: [0, 1],
    };
    const direction = directions[event.key];
    if (!editable || !direction) return;
    event.preventDefault();
    change(
      field,
      resize
        ? {
            width: clamp(field.width + direction[0], 1, 100 - field.x),
            height: clamp(field.height + direction[1], 1, 100 - field.y),
          }
        : {
            x: clamp(field.x + direction[0], 0, 100 - field.width),
            y: clamp(field.y + direction[1], 0, 100 - field.height),
          }
    );
  };

  return (
    <section aria-label="Document preview" className="min-w-0 space-y-3">
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-0 flex-1">
          <Label htmlFor="preview-document">Preview document</Label>
          <select
            id="preview-document"
            className="signatures-select"
            value={source.key}
            onChange={event =>
              setPreview({ document: event.target.value, page: 1 })
            }
          >
            {documents.map(document => (
              <option key={document.key} value={document.key}>
                {document.filename}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="preview-page">Preview page</Label>
          <select
            id="preview-page"
            className="signatures-select"
            value={pageNumber}
            onChange={event =>
              setPreview({
                document: source.key,
                page: Number(event.target.value),
              })
            }
          >
            {source.pages.map((_, index) => (
              <option key={index} value={index + 1}>
                {index + 1}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="preview-zoom">Preview zoom</Label>
          <select
            id="preview-zoom"
            className="signatures-select"
            value={zoom}
            onChange={event => setZoom(Number(event.target.value))}
          >
            {[75, 100, 150, 200].map(value => (
              <option key={value} value={value}>
                {value}%
              </option>
            ))}
          </select>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        Drag fields or use their position controls. Arrow keys move a focused
        field or resize handle by 1%.
      </p>
      {error && (
        <div role="alert">
          <p className="text-destructive">{error}</p>
          <Button
            type="button"
            variant="outline"
            onClick={() => setRefresh(value => value + 1)}
          >
            Retry preview
          </Button>
        </div>
      )}
      {!ready && !error && <p role="status">Loading PDF preview…</p>}
      <div
        ref={container}
        className="overflow-auto rounded-lg border border-border bg-muted p-2"
      >
        <div
          ref={surface}
          className="signature-page"
          data-pdf-ready={ready}
          style={{ width: displayWidth, height: displayWidth * ratio }}
        >
          <canvas
            ref={canvas}
            role="img"
            aria-label={`PDF page ${pageNumber}`}
          />
          {ready &&
            fields
              .filter(
                field =>
                  field.document_id === source.key && field.page === pageNumber
              )
              .map(field => (
                <div
                  key={field.id}
                  className={`signature-placement ${
                    field.id === selected ? "selected" : ""
                  }`}
                  style={{
                    left: `${field.x}%`,
                    top: `${field.y}%`,
                    width: `${field.width}%`,
                    height: `${field.height}%`,
                  }}
                >
                  {[false, true].map(resize => (
                    <button
                      key={String(resize)}
                      type="button"
                      className={resize ? "signature-resize" : "signature-move"}
                      aria-label={(resize ? "Resize " : "Move ") + field.label}
                      aria-disabled={!editable}
                      onClick={() => select(field)}
                      onKeyDown={event => keyboard(event, field, resize)}
                      onPointerDown={event => {
                        event.currentTarget.focus();
                        select(field);
                        if (!editable) return;
                        event.preventDefault();
                        gesture.current = {
                          field,
                          x: event.clientX,
                          y: event.clientY,
                          resize,
                        };
                        event.currentTarget.setPointerCapture(event.pointerId);
                      }}
                      onPointerMove={move}
                      onPointerUp={() => {
                        gesture.current = null;
                      }}
                      onPointerCancel={() => {
                        gesture.current = null;
                      }}
                    >
                      {resize ? "↘" : field.label}
                    </button>
                  ))}
                </div>
              ))}
        </div>
      </div>
      <details>
        <summary>Read page text</summary>
        <p className="whitespace-pre-wrap break-words text-sm">
          {text ||
            "This page contains no extractable text. Download the original document for its full content."}
        </p>
      </details>
    </section>
  );
}
