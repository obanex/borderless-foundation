# Borderless admin guide

This guide is for anyone who updates the Borderless Foundation website. No programming knowledge is needed.

- **Website:** https://obanex.github.io/borderless-foundation/
- **Admin:** https://obanex.github.io/borderless-foundation/admin/

---

## 1. Before you start (one time only)

You need:

1. **A free GitHub account.** Sign up at https://github.com/signup if you don't have one.
2. **Access to the website's repository.** The owner (obanex) invites you:
   on GitHub, open the repository → **Settings** → **Collaborators** → **Add people** → type your username.
   Accept the invitation from your e-mail or from https://github.com/notifications.

## 2. Create your access key (one time per device, about 2 minutes)

The access key lets the admin save changes for you. Treat it like a password: never share it or send it by message.

### If you are the owner (obanex)

1. Sign in to GitHub, then open: https://github.com/settings/personal-access-tokens/new
2. **Token name:** `Borderless admin`.
3. **Expiration:** for example 1 year. When it expires, just create a new one.
4. **Repository access:** choose **Only select repositories**, then pick **borderless-foundation**.
5. **Permissions** → **Repository permissions** → **Contents** → **Read and write**.
6. Click **Generate token** and **copy the key** (it starts with `github_pat_`). GitHub shows it only once.

### If you are a team member (invited collaborator)

GitHub's newer keys don't work on a repository owned by someone else, so team members use a “classic” key limited to public repositories:

1. Sign in to GitHub, then open: https://github.com/settings/tokens/new?scopes=public_repo&description=Borderless%20admin
2. **Note** is already filled in (`Borderless admin`) and only **public_repo** is ticked. Leave everything else unticked.
3. **Expiration:** for example 90 days.
4. Click **Generate token** and **copy the key** (it starts with `ghp_`). GitHub shows it only once.

> Tip for later: if the team grows, the owner can move the repository to a free GitHub organization called “Borderless Foundation”. Then everyone can use the newer, more limited keys.

## 3. Sign in to the admin

1. Open https://obanex.github.io/borderless-foundation/admin/
2. Paste your key in **Access key**.
3. Leave **Keep me signed in on this device** ticked on your own computer. Untick it on a shared computer.
4. Click **Sign in**.

## 4. Everyday editing

The menu on the left lists everything you can change:

| Section | What it controls |
|---|---|
| Scholarship guides | The scholarship programme guides (Eiffel, Chevening…) |
| Open calls | Opportunities with deadlines |
| Application toolkit | Guides for the CV, motivation letter, etc. |
| Templates & resources | Downloadable templates on the toolkit page |
| Laureates | Portraits of scholarship winners |
| Personal growth articles | Blog articles |
| Free downloads | Files on the Personal growth page |
| Ecosystem entities | The Borderless entities (Opportunities, Consulting…) |
| Ambassador programme | Ambassador benefits and career path |
| Page text | Every heading, button and sentence on the site |
| Settings & links | WhatsApp, social media, e-mail and other links |

**To add something:** open a section → **Add …** → fill in the form → **Save & publish**.

**To change something:** click the item (or the pencil ✏️) → edit → **Save & publish**.

**To delete something:** click the bin 🗑 → confirm.

**Other buttons:** ↑ ↓ change the order, ⧉ duplicates an item (handy to start from a similar one), 👁 opens it on the website.

### Tips

- **English and French:** most fields have two boxes side by side. If you leave the French box empty, the site shows the English text instead.
- **Lists** (eligibility, benefits…): write **one item per line**.
- **Articles:** leave **an empty line between paragraphs**.
- **Web address name:** leave it empty for new items; it is created from the title.
- **Files:** use **Upload file** to add a PDF or image. Then press **Save & publish**.
- **Page text:** use the search box to find the words you want to change. Keep words in `{curly brackets}` as they are; they're filled in automatically.

## 5. When do changes appear?

About **one minute** after you press **Save & publish**. Refresh the website to see them.
If you still see the old version after 2–3 minutes, do a hard refresh (Ctrl + Shift + R on Windows, Cmd + Shift + R on Mac).

## 6. Made a mistake?

Nothing is ever lost. Every save is recorded in the **change history**:
https://github.com/obanex/borderless-foundation/commits/main

To undo a change, either edit the item again in the admin, or ask the owner to restore an earlier version from the history.

## 7. Common messages

| Message | What to do |
|---|---|
| “Your access key isn't valid or has expired” | Create a new key (step 2) and sign in again. |
| “Your access key isn't allowed to save” | Your key doesn't have write access: owners need **Contents: Read and write** on **borderless-foundation**, team members need the **public_repo** box ticked. Create a new one. |
| “The repository can't be found” | You haven't accepted the collaborator invitation, or the key wasn't created for this repository. |
| “Someone else changed this content at the same time” | Another admin saved at the same moment. Make your change again. |
