import type { AiResult } from './types';

const MODEL = 'gemini-2.5-flash';

const PROMPT = `На фото — упаковка лекарства. Определи препарат (при необходимости поищи информацию) и верни ТОЛЬКО JSON без пояснений и без markdown:
{"name": "...", "ingredient": "...", "form": "...", "dosage": "...", "indications": "...", "contraindications": "...", "tags": ["..."]}
Правила:
- name — торговое название с упаковки;
- ingredient — действующее вещество;
- form — форма выпуска (таблетки, сироп, мазь, капли…);
- dosage — дозировка и как принимать, коротко и простым языком;
- indications — от чего помогает, простым языком, 1–2 предложения;
- contraindications — главные противопоказания, коротко;
- tags — от 3 до 6 коротких тегов-симптомов на русском в нижнем регистре, например "головная боль", "температура", "кашель", "аллергия";
- все тексты на русском;
- если упаковка совсем не читается и препарат не определить — верни {"error": "не удалось распознать"}.`;

export async function analyzeMedPhoto(photo: Blob, apiKey: string): Promise<AiResult> {
  // inline_data лимит запроса ~20 МБ; base64 добавляет треть — режем заранее с понятной ошибкой
  if (photo.size > 8_000_000) {
    throw new Error('Фото слишком большое. Переснимите камерой или выберите снимок поменьше.');
  }
  const b64 = await blobToBase64(photo);
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { inline_data: { mime_type: photo.type || 'image/jpeg', data: b64 } },
              { text: PROMPT },
            ],
          },
        ],
        tools: [{ google_search: {} }],
      }),
    },
  );

  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as {
      error?: { message?: string; status?: string };
    } | null;
    const apiMessage = body?.error?.message ?? '';
    // 400 у Google — любой INVALID_ARGUMENT (битый запрос, огромное фото, неверный ключ);
    // ключ виноват только если API прямо говорит об этом или это 403.
    if (res.status === 403 || /api key/i.test(apiMessage)) {
      throw new Error('Ключ API не подошёл. Проверьте его в настройках.');
    }
    if (res.status === 429) {
      throw new Error('Лимит запросов исчерпан. Подождите минуту и попробуйте снова.');
    }
    if (res.status === 400) {
      throw new Error('Сервис не принял фото. Попробуйте переснять при хорошем свете.');
    }
    throw new Error(`Сервис распознавания ответил ошибкой (${res.status}). Попробуйте ещё раз.`);
  }

  const json = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
    promptFeedback?: { blockReason?: string };
  };

  if (!json.candidates?.length && json.promptFeedback?.blockReason) {
    throw new Error('Google отказался обрабатывать этот снимок. Попробуйте другое фото упаковки.');
  }
  const text = (json.candidates?.[0]?.content?.parts ?? [])
    .map((p) => p.text ?? '')
    .join('');

  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start < 0 || end <= start) {
    throw new Error('Не получилось разобрать ответ. Попробуйте другое фото.');
  }
  let parsed: AiResult;
  try {
    parsed = JSON.parse(text.slice(start, end + 1)) as AiResult;
  } catch {
    throw new Error('Не получилось разобрать ответ. Попробуйте другое фото.');
  }
  if (parsed.error || !parsed.name) {
    throw new Error('Не удалось распознать упаковку. Сфотографируйте поближе при хорошем свете.');
  }
  return parsed;
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve((r.result as string).split(',')[1]);
    r.onerror = () => reject(r.error);
    r.readAsDataURL(blob);
  });
}
