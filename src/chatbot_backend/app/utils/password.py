"""Utility script for password hashing."""
import sys
from app.core.security import hash_password


def main():
    """Hash a password from command line argument."""
    if len(sys.argv) != 2:
        print("Usage: python -m app.utils.password <password>")
        sys.exit(1)

    password = sys.argv[1]
    hashed = hash_password(password)
    print(f"Hashed password: {hashed}")


if __name__ == "__main__":
    main()
