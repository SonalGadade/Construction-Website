# Stage 1: Build stage
FROM maven:3.9.6-eclipse-temurin-17 AS build
WORKDIR /app
COPY Final_Skill_Verse-Development/pom.xml .
COPY Final_Skill_Verse-Development/src ./src
RUN mvn clean package -DskipTests

# Stage 2: Runtime stage with Xvfb for JavaFX headless GUI environment
FROM eclipse-temurin:17-jre
WORKDIR /app

# Install Xvfb and native graphics libraries for JavaFX (Debian 12 compatible)
RUN apt-get update && apt-get install -y \
    xvfb \
    libgl1 \
    libglx-mesa0 \
    libgtk-3-0 \
    libxtst6 \
    libxrender1 \
    libasound2 \
    && rm -rf /var/lib/apt/lists/*

COPY --from=build /app/target/final-skill-verse-1.0-SNAPSHOT.jar app.jar

EXPOSE 8080

# Start Xvfb virtual frame buffer display :99 and run the application
CMD ["sh", "-c", "Xvfb :99 -screen 0 1024x768x16 & export DISPLAY=:99 && java -jar app.jar"]
