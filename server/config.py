TORTOISE_ORM = {
    "connections": {"default": "postgres://admin:admin@localhost:5432/mydb"},
    "apps": {
        "models": {
            "models": ["main", "aerich.models"],  # <--- include aerich
            "default_connection": "default",
        },
    },
}
