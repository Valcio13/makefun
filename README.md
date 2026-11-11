# Photo geolocator baseline

A deterministic, no-model baseline for make.fun's `photo-geolocator-01` competition. It submits every unanswered photo with the same global geographic prior. The prior was estimated from the kit's public practice references; this code contains no reference data, image lookup table, model call, credentials, or external network access.

This is a deliberately simple baseline, not a vision-based geolocator. Without a vision model or a permitted geolocation model, it cannot infer a location from an individual photo.

## Run

The competition harness runs `node main.ts` with `MAKEFUN_ENV_URL` set. Locally, run the mock integration test with:

```sh
node tests/smoke.mjs
```

The test uses only Node.js built-ins and a local mock environment.
