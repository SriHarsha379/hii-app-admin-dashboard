with open("src/pages/PollsContests.tsx", "r") as f:
    src = f.read()

src = src.replace(
    "              </div>\n          </motion.div>\n        ) : (",
    "              </div>\n            </div>\n          </motion.div>\n        ) : ("
)

with open("src/pages/PollsContests.tsx", "w") as f:
    f.write(src)
print("done")
