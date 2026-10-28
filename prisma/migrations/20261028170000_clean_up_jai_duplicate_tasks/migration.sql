-- Jai's older hand-entered tasks that the Jun–Oct 2026 work log now covers
-- (20261028150000_add_jai_work_log). Logs and attachments go with them (cascade).
DELETE FROM "Task" WHERE "id" IN (
  -- PRMS video = the PRMS Short Film sub-task under Video
  'cmumhx66v001zukr0n7lti8gv',
  -- covered by Confidential sub-tasks
  'cmumhx66t001nukr09xhl0rzu', -- Mueller Streamline agency agreement → Agreement (agency)
  'cmumhx66t001lukr06k5ju0j5', -- Interim OEM Agreement → Agreement (OEM)
  'cmumhx66q000rukr09v4hyhw2', -- RegO India pitch deck → Market-entry presentation
  -- removed at Jai's request
  'cmumhx66r000zukr0qgthibtv', -- Independence Day video and LinkedIn post
  -- straight duplicates of work log sub-tasks
  'cmumhx66u001vukr0kto4wdjb', -- LPG system quotation and proposal format
  'cmumhx66v0021ukr08aixk69s', -- Prepaid gas meter tutorial video
  'cmumhx66u001tukr0qdvjzbid', -- OWN IT task app rollout
  'cmumhx66u001rukr08wdtfa1j', -- Staff attendance app launch
  'cmumhx66s0019ukr0v9l1mm5q', -- Onam shoot, photos and videos
  'cmumhx66t001fukr097iniwna', -- MOOKEN website beta and Google Analytics setup
  'cmumhx66r000vukr0foo35b82', -- Liquid Gas Week 2026 emailer
  'cmumhx66o000hukr0otz4w937', -- "We Are Hiring" social posts
  'cmumhx66r000tukr0uhekkv0u', -- Brand guidelines and Credit Application Form
  'cmumhx66p000lukr01j0yyj8o', -- Pure Gas cylinder stickers and CoA
  'cmumhx66n000bukr09prd7j2j', -- Tissue box design
  'cmumhx66p000jukr0j10jc8ig', -- Business card, final front and back
  'cmumhx66m0007ukr0bhudsy2p', -- Business card for Abraham, first drafts
  'cmumhx66r000xukr05arcayb8', -- Gift box design and FlipHTML5 catalogue
  'cmumhx66n000dukr0e9fzeqtz', -- Hose clip, disc and thread tape catalogues
  'cmumhx66q000nukr0vreb9pbt', -- Combined MOOKEN catalogue, final
  'cmumhx66l0003ukr0z7ycrbnn', -- Combined product catalogue, A3 and A2 drafts
  'cmumhx66s0013ukr0at5wlwee', -- Brand asset document v6 and final logo files
  'cmumhx66k0001ukr0b0j3bp74', -- Brand asset review and logo colour audit
  'cmumhx66n0009ukr0dfsin06m', -- Logo colour palette options
  'cmumhx66t001jukr08a95b22y'  -- MOOKEN Back in Stock WhatsApp statuses
);

UPDATE "Task" SET "title" = 'Mueller Streamline Agency Agreement (Confidential)'
WHERE "id" = 'jw3a94af1190f35b6f02f0a78';
