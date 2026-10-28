import { Hono } from "hono";

const app = new Hono();

app.get("/", (c) => {
  return c.text("Hello Hono!");
});

app.get("/health", (c) => {
  return c.text("ok");
});

const PORT = process.env.PORT || "3000";

export default {
  port: parseInt(PORT),
  fetch: app.fetch,
};
