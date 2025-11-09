#!/usr/bin/env python3
"""
Clear all documents from collections in target MongoDB databases.

This script is intentionally destructive. It lists the databases and collections
that will be affected and requires an explicit confirmation (type DELETE) to
proceed unless --yes/ -y is passed.

Usage:
  python scripts/clear_databases.py           # clears the configured DB
  python scripts/clear_databases.py --all-dbs # clears all non-system DBs on the server
  python scripts/clear_databases.py --drop    # drops the target databases instead of deleting documents
  python scripts/clear_databases.py -y --all-dbs --drop  # run without interactive confirmation
"""
from __future__ import annotations

import argparse
import sys
from dataclasses import dataclass
from typing import Dict, List

from pymongo import MongoClient

try:
    # prefer existing project config
    from config import config
except Exception:
    config = None


@dataclass
class CollInfo:
    name: str
    count: int


def prompt_confirm() -> str:
    try:
        return input("Type DELETE to confirm: ")
    except KeyboardInterrupt:
        print()
        sys.exit(1)


def gather_summary(client: MongoClient, db_names: List[str]) -> Dict[str, List[CollInfo]]:
    summary: Dict[str, List[CollInfo]] = {}
    for dbname in db_names:
        db = client.get_database(dbname)
        colls = []
        for coll_name in db.list_collection_names():
            try:
                count = db.get_collection(coll_name).count_documents({})
            except Exception:
                count = -1
            colls.append(CollInfo(name=coll_name, count=count))
        summary[dbname] = colls
    return summary


def print_summary(summary: Dict[str, List[CollInfo]]) -> None:
    print("Summary of targeted databases/collections:")
    total_docs = 0
    for dbname, colls in summary.items():
        print(f"- Database: {dbname}")
        if not colls:
            print("    (no collections)")
            continue
        for c in colls:
            count_str = str(c.count) if c.count >= 0 else "?"
            print(f"    - {c.name}: {count_str} documents")
            if c.count and c.count > 0:
                total_docs += c.count
    print()
    print(f"Total documents (approx): {total_docs}")


def run_delete(client: MongoClient, summary: Dict[str, List[CollInfo]], drop: bool) -> None:
    for dbname, colls in summary.items():
        db = client.get_database(dbname)
        if drop:
            print(f"Dropping database '{dbname}'...")
            client.drop_database(dbname)
            print("  dropped")
            continue

        for c in colls:
            print(f"Clearing {dbname}.{c.name} (was ~{c.count} documents)...", end=" ")
            try:
                res = db.get_collection(c.name).delete_many({})
                print(f"deleted {res.deleted_count}")
            except Exception as e:
                print(f"failed: {e}")


def main() -> None:
    parser = argparse.ArgumentParser(description="Clear all documents from target MongoDB databases")
    parser.add_argument("--all-dbs", action="store_true", help="Target all non-system databases on the server")
    parser.add_argument("--drop", action="store_true", help="Drop the target databases instead of deleting documents (more destructive)")
    parser.add_argument("-y", "--yes", action="store_true", help="Skip interactive confirmation")
    args = parser.parse_args()

    if config is None:
        print("Could not import project config. Please run this script from the project environment where 'config' is available.")
        sys.exit(2)

    client = MongoClient(config.MONGO_URI)

    if args.all_dbs:
        # avoid dropping system DBs unless explicitly requested
        db_names = [d for d in client.list_database_names() if d not in ("admin", "local", "config")]
    else:
        db_names = [config.MONGO_DB_NAME]

    if not db_names:
        print("No databases found to operate on.")
        return

    summary = gather_summary(client, db_names)
    print_summary(summary)

    if not args.yes:
        print("WARNING: This operation is destructive.")
        resp = prompt_confirm()
        if resp.strip() != "DELETE":
            print("Confirmation not received. Aborting.")
            return

    run_delete(client, summary, args.drop)
    print("Operation completed.")


if __name__ == "__main__":
    main()
