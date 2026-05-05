from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# This is our connection string. It tells Python:
# "Go to localhost, port 5432, look for database 'notification_system', 
# and log in with user 'naimur' and password '1234'"
SQLALCHEMY_DATABASE_URL = "postgresql://naimur:1234@localhost:5432/notification_system"

# This 'engine' is the machine that manages the connection
engine = create_engine(SQLALCHEMY_DATABASE_URL)

# This 'SessionLocal' is what we will use to talk to the database 
# (e.g., to ask "Give me all users")
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# This 'Base' is a foundation class. All our data tables will "inherit" 
# from this so that SQLAlchemy recognizes them as database tables.
Base = declarative_base()

# This is a helper function to open a connection, do the work, and then close it.
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()