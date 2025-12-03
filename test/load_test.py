import asyncio
import httpx
import random

URL = "http://localhost:7000/health"
NUM_USERS = 100
MAX_REQUESTS_PER_USER = 1

async def user_simulation(user_id, client):
    for i in range(MAX_REQUESTS_PER_USER):
        response = await client.get(URL)
        print(f"User {user_id}, Request {i+1}: {response.status_code}")
        await asyncio.sleep(random.uniform(24,25))  

async def main():
    async with httpx.AsyncClient() as client:
        tasks = [user_simulation(i, client) for i in range(1, NUM_USERS+1)]
        await asyncio.gather(*tasks)

# if __name__ == "__main__":
asyncio.run(main())
