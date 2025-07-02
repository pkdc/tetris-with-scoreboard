package main

import (
	"encoding/json"
	"errors"
	"fmt"
	"html/template"
	"io"
	"io/fs"
	"log"
	"net/http"
	"os"
	"strconv"
	"strings"
)

// type GRecords struct {
// 	GameRecords []GameRecord `json:"game_records"`
// }

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

func homeHandler(w http.ResponseWriter, r *http.Request) {
	// tpl, err := template.ParseFiles("./assets/index.html") for localhost
	tpl, err := template.ParseFiles("../../assets/index.html") // for render, coz root is set to /cmd/api
	if err != nil {
		http.Error(w, "Parsing Error", http.StatusInternalServerError)
		return
	}
	err = tpl.ExecuteTemplate(w, "index.html", nil)
}

func getJsonData(file *os.File, jsonRecords *[]GameRecord) {

	// get the records from record.json
	byteRecord, _ := io.ReadAll(file)
	json.Unmarshal(byteRecord, jsonRecords)
	// for _, r := range *jsonRecords {
	// 	fmt.Printf("prev records: %v\n", r)
	// }
}

func recordHandler(w http.ResponseWriter, r *http.Request) {
	// fmt.Printf("-------method---------%s\n", r.Method)
	if r.Method != http.MethodPost && r.Method != http.MethodGet {
		http.Error(w, "Bad request", http.StatusBadRequest)
	}

	if r.URL.Path == "/record/" {
		// Get to get
		// not used
		if r.Method == http.MethodGet {
			fmt.Printf("----record-GET-----\n")

			var Records []GameRecord
			f, err := os.OpenFile("record.json", os.O_RDONLY, 0644)
			if errors.Is(err, fs.ErrNotExist) {
				http.Error(w, "Please play the game first", http.StatusBadRequest)
			} else {
				// get the records from record.json
				getJsonData(f, &Records)

				js, err := json.MarshalIndent(Records, "", "\t")
				if err != nil {
					log.Fatal(err)
				}

				// respond with json
				w.Header().Set("Content-Type", "application/json")
				w.WriteHeader(http.StatusOK)
				w.Write(js)
			}
		}

		// Post to store, and then return
		if r.Method == http.MethodPost {
			fmt.Printf("----record-POST-----\n")
			// err := r.ParseForm()
			// if err != nil {
			// 	log.Fatal(err)
			// }
			var payload gameRecordPayload

			err := json.NewDecoder(r.Body).Decode(&payload)

			fmt.Println(payload)

			idStr := payload.Id
			pname := payload.PlayerName
			score := payload.GameScore
			time := payload.GameTime

			id, err := strconv.Atoi(idStr)
			if err != nil {
				log.Fatal(err)
			}

			fmt.Printf("Id: %d\n", id)
			// pname := r.PostForm.Get("pname")
			fmt.Printf("Name: %s\n", pname)
			// score := r.PostForm.Get("score")
			fmt.Printf("Score: %s\n", score)
			// time := r.PostForm.Get("time")
			fmt.Printf("Time: %s\n", time)

			curRecord := GameRecord{
				Id:         id,
				PlayerName: pname,
				GameScore:  score,
				GameTime:   time,
			}

			// try to open to read
			f, err := os.OpenFile("record.json", os.O_RDONLY, 0444)
			// if file not exist
			if errors.Is(err, fs.ErrNotExist) {

				var Records []GameRecord
				Records = append(Records, curRecord)

				for _, r := range Records {
					fmt.Printf("first record: %v\n", r)
				}

				js, err := json.MarshalIndent(Records, "", "\t")
				if err != nil {
					log.Fatal(err)
				}

				err = os.WriteFile("record.json", js, 0644)
				if err != nil {
					log.Fatal(err)
				}

				f, err := os.OpenFile("record.json", os.O_RDONLY, 0444)
				if errors.Is(err, fs.ErrNotExist) {
					log.Fatal(err)
				}
				defer f.Close()

				getJsonData(f, &Records)

				w.Header().Set("Content-Type", "application/json")
				w.WriteHeader(http.StatusOK)
				w.Write(js)

				return
			}
			defer f.Close()

			// if file exist
			var Records []GameRecord
			// var recordStr string

			// get the records from record.json
			getJsonData(f, &Records)

			Records = append(Records, curRecord)

			// fmt.Println("---------------------------------")
			// for _, r := range Records {
			// 	fmt.Printf("after records: %v\n", r)
			// }

			js, err := json.MarshalIndent(Records, "", "\t")
			if err != nil {
				log.Fatal(err)
			}

			err = os.WriteFile("record.json", js, 0644)
			if err != nil {
				log.Fatal(err)
			}
			// f.Write([]byte('\n'))

			// For testing: send back the most updated records
			// w.Header().Set("Content-Type", "application/json")
			// w.WriteHeader(http.StatusOK)
			// w.Write(js)

			// w.Header().Set("Location", "/")
			// w.WriteHeader(http.StatusSeeOther)
		}
	} else {
		fmt.Println("Individual record")
		urlSlice := strings.Split(r.URL.Path, "/")
		fmt.Printf("%s space, %s is record, id: %s \n", urlSlice[0], urlSlice[1], urlSlice[2])
		id, err := strconv.Atoi(urlSlice[2])
		if err != nil {
			log.Fatal(err)
		}

		fmt.Printf("----Individual record-GET %d-----\n", id)

		var Records []GameRecord
		f, err := os.OpenFile("record.json", os.O_RDONLY, 0644)
		if errors.Is(err, fs.ErrNotExist) {
			http.Error(w, "Requested Game Record doesn't exist", http.StatusBadRequest)
		} else {
			// get the records from record.json
			getJsonData(f, &Records)

			// fmt.Println("Records[id]")

			if id >= len(Records) {
				http.Error(w, "Requested Game Record doesn't exist", http.StatusBadRequest)
				return
			}

			js, err := json.MarshalIndent(Records[id], "", "\t")
			if err != nil {
				log.Fatal(err)
			}

			// respond with json
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusOK)
			w.Write(js)
		}
	}
}

func main() {
	mux := http.NewServeMux()
	mux.Handle("/assets/", http.StripPrefix("/assets", http.FileServer(http.Dir("./assets"))))
	mux.HandleFunc("/", homeHandler)
	mux.HandleFunc("/record/", recordHandler)

	// fmt.Println("Starting server at port 8080")

	// err := http.ListenAndServe(":8080", mux)
	// if err != nil {
	// 	log.Fatal(err)
	// }

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Starting server at port %s", port)
	if err := http.ListenAndServe(":"+port, mux); err != nil {
		log.Fatal(err)
	}
}
