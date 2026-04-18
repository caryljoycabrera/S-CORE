$c = [IO.File]::ReadAllText("public/javascripts/ejs/allrequestsadmin.js")
$t1 = "const response = await fetch(`/api/revision-history/$[requestId]`);"
$t1 = $t1.Replace("[", "{").Replace("]", "}")
$l = "if(historySection)historySection.style.display='block';if(historyContainer)historyContainer.innerHTML='<div style="text-align:center;padding:2rem;"><div class="spinner-border text-primary" role="status"></div><p style="margin-top:1rem;color:#6b7280;font-size:0.875rem;">Loading revision history...</p></div>';
        "
$c = $c.Replace($t1, $l + $t1)

$t2 = "const response = await fetch(`/api/service-revision-history/$[requestId]`);"
$t2 = $t2.Replace("[", "{").Replace("]", "}")
$c = $c.Replace($t2, $l + $t2)

[IO.File]::WriteAllText("public/javascripts/ejs/allrequestsadmin.js", $c)

$c2 = [IO.File]::ReadAllText("public/javascripts/ejs/approvals.js")
$c2 = $c2.Replace($t1, $l + $t1)
[IO.File]::WriteAllText("public/javascripts/ejs/approvals.js", $c2)

$c3 = [IO.File]::ReadAllText("public/javascripts/ejs/services.js")
$c3 = $c3.Replace($t2, $l + $t2)
[IO.File]::WriteAllText("public/javascripts/ejs/services.js", $c3)
