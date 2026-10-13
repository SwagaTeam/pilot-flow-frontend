# Pilot Flow — Frontend

Материалы для независимой разработки интерфейса. [Backend ASP.NET Core / C#](https://github.com/SwagaTeam/pilot-flow-backend).

Сам интерфейс ещё не реализован; frontend-фреймворк не выбран.

## Начать без backend

1. Открыть `handoff.html` и `figma-api-map.csv` (41 экран Figma).
2. Запустить `node mock-server.mjs`.
3. Открыть http://localhost:5080/swagger.html.
4. Использовать GET-ответы mock для экранов и примеры из `control-example.json`.

Mock только для чтения: запись, PDF и вычисление новых данных не реализованы. POST/PUT/DELETE возвращают 501. Swagger также можно открыть автономно из `swagger.html`.

## Ответственность frontend

Экраны по Figma; формы и состояния unknown/incomplete/provisional; причины ошибок из API; выбор и подтверждение семейств; таблицы допуска/сравнения; просмотр решения. Баллы, совместимость и готовность вычисляет backend. Сохранять decimal-строки без потери точности; соблюдать If-Match; на 412 перечитывать данные.

## Единый контракт

`openapi.yaml` и `openapi.json` — копия контракта backend 1.0.0: 45 операций, 51 схема. Изменения согласованно синхронизируются из backend; не редактировать контракт независимо.

SQL и полный архив находятся в [backend](https://github.com/SwagaTeam/pilot-flow-backend). Общая инструкция `handoff.html` описывает обе команды; команды применения SQL выполняет backend-команда.

`LICENSE` и `NOTICE` относятся к Swagger UI 5.18.2, а не назначают лицензию всему проекту.
