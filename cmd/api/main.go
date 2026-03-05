package main

import (
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"io/fs"
	"log"
	"net/http"
	"os"
	"strconv"
	"strings"
	"sync"
)

type gameRecordPayload struct {
	Id         string `json:"id"`
	PlayerName string `json:"pname"`
	GameScore  string `json:"score"`
	GameTime   string `json:"time"`
}

type GameRecord struct {
	Id         int    `json:"id"`
	PlayerName string `json:"pname"`
	GameScore  string `json:"score"`
	GameTime   string `json:"time"`
}

// basePath is set at startup based on working directory
var basePath string

// fileMu protects concurrent access to record.json
var fileMu sync.Mutex

// maxPlayerNameLen limits player name length to prevent abuse
const maxPlayerNameLen = 50

// maxRecords limits the total number of stored records
const maxRecords = 10000

// maxRequestBodySize limits request body to 1KB
const maxRequestBodySize = 1024

func homeHandler(w http.ResponseWriter, r *http.Request) {
	http.ServeFile(w, r, basePath+"/index.html")
}

func getJsonData(file *os.File, jsonRecords *[]GameRecord) error {
	byteRecord, err := io.ReadAll(file)
	if err != nil {
		return fmt.Errorf("failed to read file: %w", err)
	}
	if err := json.Unmarshal(byteRecord, jsonRecords); err != nil {
		return fmt.Errorf("failed to parse JSON: %w", err)
	}
	return nil
}

// sanitizeName trims whitespace and enforces length limit
func sanitizeName(name string) string {
	name = strings.TrimSpace(name)
	if len(name) > maxPlayerNameLen {
		name = name[:maxPlayerNameLen]
	}
	return name
}

// validateScore checks that a score string is a valid non-negative integer
func validateScore(score string) bool {
	if score == "" {
		return false
	}
	n, err := strconv.Atoi(score)
	return err == nil && n >= 0
}

// validateTime checks that a time string matches MM:SS format
func validateTime(t string) bool {
	if len(t) != 5 || t[2] != ':' {
		return false
	}
	_, err1 := strconv.Atoi(t[:2])
	_, err2 := strconv.Atoi(t[3:])
	return err1 == nil && err2 == nil
}

func recordHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost && r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	if r.URL.Path == "/record/" {
		if r.Method == http.MethodGet {
			fileMu.Lock()
			defer fileMu.Unlock()

			var Records []GameRecord
			f, err := os.OpenFile("record.json", os.O_RDONLY, 0644)
			if errors.Is(err, fs.ErrNotExist) {
				http.Error(w, "Please play the game first", http.StatusBadRequest)
				return
			}
			if err != nil {
				http.Error(w, "Internal server error", http.StatusInternalServerError)
				log.Printf("Error opening record.json: %v", err)
				return
			}
			defer f.Close()

			if err := getJsonData(f, &Records); err != nil {
				http.Error(w, "Internal server error", http.StatusInternalServerError)
				log.Printf("Error reading records: %v", err)
				return
			}

			js, err := json.MarshalIndent(Records, "", "\t")
			if err != nil {
				http.Error(w, "Internal server error", http.StatusInternalServerError)
				log.Printf("Error marshaling records: %v", err)
				return
			}

			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusOK)
			w.Write(js)
		}

		if r.Method == http.MethodPost {
			// Limit request body size to prevent memory exhaustion
			r.Body = http.MaxBytesReader(w, r.Body, maxRequestBodySize)

			var payload gameRecordPayload
			err := json.NewDecoder(r.Body).Decode(&payload)
			if err != nil {
				http.Error(w, "Invalid JSON payload", http.StatusBadRequest)
				return
			}

			idStr := payload.Id
			pname := sanitizeName(payload.PlayerName)
			score := payload.GameScore
			gameTime := payload.GameTime

			// Validate required fields
			if idStr == "" {
				http.Error(w, "ID is required", http.StatusBadRequest)
				return
			}

			if pname == "" {
				http.Error(w, "Player name is required", http.StatusBadRequest)
				return
			}

			id, err := strconv.Atoi(idStr)
			if err != nil {
				http.Error(w, "Invalid ID format", http.StatusBadRequest)
				return
			}

			if id < 0 {
				http.Error(w, "Invalid ID", http.StatusBadRequest)
				return
			}

			if !validateScore(score) {
				http.Error(w, "Invalid score format", http.StatusBadRequest)
				return
			}

			if !validateTime(gameTime) {
				http.Error(w, "Invalid time format", http.StatusBadRequest)
				return
			}

			curRecord := GameRecord{
				Id:         id,
				PlayerName: pname,
				GameScore:  score,
				GameTime:   gameTime,
			}

			fileMu.Lock()
			defer fileMu.Unlock()

			// try to open to read
			f, err := os.OpenFile("record.json", os.O_RDONLY, 0444)
			// if file not exist
			if errors.Is(err, fs.ErrNotExist) {

				var Records []GameRecord
				Records = append(Records, curRecord)

				js, err := json.MarshalIndent(Records, "", "\t")
				if err != nil {
					http.Error(w, "Internal server error", http.StatusInternalServerError)
					log.Printf("Error marshaling records: %v", err)
					return
				}

				err = os.WriteFile("record.json", js, 0644)
				if err != nil {
					http.Error(w, "Internal server error", http.StatusInternalServerError)
					log.Printf("Error writing record.json: %v", err)
					return
				}

				w.Header().Set("Content-Type", "application/json")
				w.WriteHeader(http.StatusOK)
				w.Write(js)

				return
			}
			if err != nil {
				http.Error(w, "Internal server error", http.StatusInternalServerError)
				log.Printf("Error opening record.json: %v", err)
				return
			}
			defer f.Close()

			// if file exist
			var Records []GameRecord

			if err := getJsonData(f, &Records); err != nil {
				http.Error(w, "Internal server error", http.StatusInternalServerError)
				log.Printf("Error reading records: %v", err)
				return
			}

			// Prevent unbounded file growth
			if len(Records) >= maxRecords {
				http.Error(w, "Maximum number of records reached", http.StatusConflict)
				return
			}

			Records = append(Records, curRecord)

			js, err := json.MarshalIndent(Records, "", "\t")
			if err != nil {
				http.Error(w, "Internal server error", http.StatusInternalServerError)
				log.Printf("Error marshaling records: %v", err)
				return
			}

			err = os.WriteFile("record.json", js, 0644)
			if err != nil {
				http.Error(w, "Internal server error", http.StatusInternalServerError)
				log.Printf("Error writing record.json: %v", err)
				return
			}
		}
	} else {
		urlSlice := strings.Split(r.URL.Path, "/")
		if len(urlSlice) < 3 || urlSlice[2] == "" {
			http.Error(w, "Invalid record URL", http.StatusBadRequest)
			return
		}

		id, err := strconv.Atoi(urlSlice[2])
		if err != nil {
			http.Error(w, "Invalid record ID", http.StatusBadRequest)
			return
		}

		if id < 0 {
			http.Error(w, "Invalid record ID", http.StatusBadRequest)
			return
		}

		fileMu.Lock()
		defer fileMu.Unlock()

		var Records []GameRecord
		f, err := os.OpenFile("record.json", os.O_RDONLY, 0644)
		if errors.Is(err, fs.ErrNotExist) {
			http.Error(w, "Requested Game Record doesn't exist", http.StatusBadRequest)
			return
		}
		if err != nil {
			http.Error(w, "Internal server error", http.StatusInternalServerError)
			log.Printf("Error opening record.json: %v", err)
			return
		}
		defer f.Close()

		if err := getJsonData(f, &Records); err != nil {
			http.Error(w, "Internal server error", http.StatusInternalServerError)
			log.Printf("Error reading records: %v", err)
			return
		}

		if id >= len(Records) {
			http.Error(w, "Requested Game Record doesn't exist", http.StatusBadRequest)
			return
		}

		js, err := json.MarshalIndent(Records[id], "", "\t")
		if err != nil {
			http.Error(w, "Internal server error", http.StatusInternalServerError)
			log.Printf("Error marshaling record: %v", err)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		w.Write(js)
	}
}

// getBasePath returns the correct base path for assets
// Works both when run from project root (go run cmd/api/main.go) and from cmd/api (go run main.go)
func getBasePath() string {
	// Check if we're in project root (assets folder exists here)
	if _, err := os.Stat("assets/index.html"); err == nil {
		return "assets"
	}
	// Otherwise assume we're in cmd/api
	return "../../assets"
}

func main() {
	basePath = getBasePath()

	mux := http.NewServeMux()
	mux.Handle("/assets/", http.StripPrefix("/assets", http.FileServer(http.Dir(basePath))))
	mux.HandleFunc("/", homeHandler)
	mux.HandleFunc("/record/", recordHandler)

	// Get port from environment variable (for production) or default to 8080 (for localhost)
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	fmt.Printf("Starting server at port %s\n", port)
	if port == "8080" {
		fmt.Println("Access at: http://localhost:8080")
	}

	err := http.ListenAndServe(":"+port, mux)
	if err != nil {
		log.Fatal(err)
	}
}
