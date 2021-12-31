#!/bin/bash

case "$1" in
	   "mineBlock") 
		       curl -H "Content-type:application/json" --data "{\"data\" : [\"$2\"]}" http://localhost:3001/mineBlock
		             ;;
			        "blocks") curl -X GET http://localhost:3001/blocks | python3 -m json.tool
					      ;;
			      esac
