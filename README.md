# Weartual Mobile MVP

Cross-platform Expo app connected to the same backend as your web app.

## 1) Configure backend URL

Copy `.env.example` to `.env` and set:

`EXPO_PUBLIC_API_URL=http://YOUR_LOCAL_IP:5000`

Use your machine LAN IP (not localhost) when testing on a phone.

## 2) Run app

- `npm run android`
- `npm run ios`
- `npm start`

## 3) Current MVP scope

- Login and Signup against `/api/auth/*`
- Persisted session token in local storage
- Fetch current user (`/api/auth/me`)
- Bottom tab flow: Home, Try-On, History, Profile
- Try-On upload with multipart fields `image` and `garment` to `/api/images/me`
- Outfit history list from `/api/images/me`

## 4) Keep website + app in sync

- Reuse the same backend endpoints and payloads
- Put all mobile API calls under `src/services`
- Add new web backend features there first, then mobile screen wiring

## 5) Self updates later (polished phase)

For auto-updating app builds, use Expo EAS Update in production.
