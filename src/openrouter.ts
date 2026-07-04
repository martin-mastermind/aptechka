import type { AiResult } from './types';

// ponytail: бесплатные vision-модели OpenRouter; первая — основная, остальные — фолбэк-роутинг
const MODELS = [
  'google/gemma-4-31b-it:free',
  'google/gemma-4-26b-a4b-it:free',
  'nvidia/nemotron-nano-12b-v2-vl:free',
];

const PROMPT = `На фото — упаковка лекарства. Определи препарат и верни ТОЛЬКО JSON без пояснений и без markdown:
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
  // base64 добавляет треть к размеру — режем заранее с понятной ошибкой
  if (photo.size > 8_000_000) {
    throw new Error('Фото слишком большое. Переснимите камерой или выберите снимок поменьше.');
  }
  const b64 = await blobToBase64(photo);
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODELS[0],
      models: MODELS,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: { url: `data:${photo.type || 'image/jpeg'};base64,${b64}` },
            },
            { type: 'text', text: PROMPT },
          ],
        },
      ],
    }),
  });

  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      throw new Error('Ключ API не подошёл. Проверьте его в настройках.');
    }
    if (res.status === 429) {
      throw new Error('Лимит бесплатных запросов исчерпан. Подождите минуту и попробуйте снова.');
    }
    if (res.status === 402) {
      throw new Error('OpenRouter требует пополнить баланс. Проверьте аккаунт на openrouter.ai.');
    }
    if (res.status === 400) {
      throw new Error('Сервис не принял фото. Попробуйте переснять при хорошем свете.');
    }
    throw new Error(`Сервис распознавания ответил ошибкой (${res.status}). Попробуйте ещё раз.`);
  }

  const json = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
    error?: { message?: string };
  };

  if (json.error) {
    throw new Error(
      `Сервис распознавания ответил ошибкой: ${json.error.message ?? 'неизвестная ошибка'}.`,
    );
  }
  const text = json.choices?.[0]?.message?.content ?? '';

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
