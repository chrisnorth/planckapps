#!/usr/bin/perl

# Get inputs
$rawdir = $ARGV[0];
$omega = $ARGV[1];
$domega = 0.05;	# Default


# Only one argument provided so assume 
# it is the omega rather than the rawdir
if(!$omega){
	$omega = $rawdir;
	# Open the configuration file
	if(-e "omegas.conf"){
		open(CONF,"omegas.conf");
		@lines = <CONF>;
		close(CONF);
		foreach $line (@lines){
			$line =~ s/[\n\r]//g;
			$line =~ s/^[\s\t]*//;
			($key,$val) = split(/\t|\s\=\s/,$line);
			if($key eq "RAWDIR"){ $rawdir = $val; }
			if($key eq "DOMEGA"){ $domega = $val; }
		}
	}else{
		$rawdir = "";
	}
}


if(!$omega){
	print "\n";
	print "POWER SPECTRUM REDUCED JSON CREATOR\n";
	print "===================================\n";
	print "Creates reduced JSON files from raw Cl vs l files of the form:\n";
	print "\t2    0.23516E+04    0.39952E-01    0.10839E-01    0.79619E+01\n";
	print "\t3    0.28863E+04    0.72897E-01    0.17269E-01    0.12969E+02\n";
	print "\t.\n";
	print "\t.\n\n";
	print "USAGE:\n";
	print "======\n";
	print "\tperl omegas.pl [raw directory]? b\t<- to create all the baryonic matter files\n";
	print "\tperl omegas.pl [raw directory]? c\t<- to create all the CDM files\n";
	print "\tperl omegas.pl [raw directory]? l\t<- to create all the Dark Energy files\n\n";
	print "NOTES:\n";
	print "======\n";
	print "Before using this create an omega.conf file of the form:\n\n";
	print "\tRAWDIR = <path to directory containing raw power spectrum files>\n";
	print "\tDOMEGA = <Omega step size>\n\n";
	exit();
}

$n = 1/$domega;

for($a = 0; $a <= $n ; $a++){

	for($b = 0; $b <= $n ; $b++){

		$ofile = "";
		if($omega eq "b"){
			$omega_c = sprintf("%0.2f",$a*$domega);
			$omega_l = sprintf("%0.2f",$b*$domega);
			$ofile = "Ob_Oc".$omega_c."_Ol".$omega_l."_lin.json";
		}elsif($omega eq "c"){
			$omega_b = sprintf("%0.2f",$a*$domega);
			$omega_l = sprintf("%0.2f",$b*$domega);
			$ofile = "Ob".$omega_b."_Oc_Ol".$omega_l."_lin.json";
		}elsif($omega eq "l"){
			$omega_b = sprintf("%0.2f",$a*$domega);
			$omega_c = sprintf("%0.2f",$b*$domega);
			$ofile = "Ob".$omega_b."_Oc".$omega_c."_Ol_lin.json";
		}

		if(!$ofile){ next; }

		$output = "{\n\t\"extrema\": [\n";
		
		# Loop over each Omega file
		for($i = ($omega eq "b" ? 1 : 0); $i < 21 ; $i++){
			if($omega eq "b"){
				$o = $i*$domega;
				$omega_b = sprintf("%0.2f",$i*$domega);
			}elsif($omega eq "c"){
				$omega_c = sprintf("%0.2f",$i*$domega);
				$o = $i*$domega;
			}elsif($omega eq "l"){
				$omega_l = sprintf("%0.2f",$i*$domega);
				$o = $i*$domega;
			}
	
			open(FILE,$rawdir.getFile($omega_b,$omega_c,$omega_l));
			@lines = <FILE>;
			close(FILE);
	
			@ls = ();
			@cls = ();
			
			for($j = 0; $j < @lines ; $j++){
				$lines[$j] =~ s/  / /g;
				$lines[$j] =~ s/[\n\r]//g;
				$lines[$j] =~ s/^ //g;
				($l,$T,$E,$B,$TE) = split(" ",$lines[$j]);
				push(@ls,$l);
				push(@cls,$T+0);
			}
			
			$output .= getPeaks($o);
			
			if($i < 20){
				$output .= ",\n";
			}
	
		}
		$output .= "\n\t]\n}";
	
		print "Saved $ofile\n";
		open(FILE,">",$ofile);
		print FILE "$output\n";
		close(FILE);
	}
}  
  

sub getFile(){ return "Ob".$_[0]."_Oc".$_[1]."_Ol".$_[2]."_nolensing_totCls.dat"; }


sub getPeaks(){

	my($om,$output,$j,$k,$firstpeak,$previous);

	$om = $_[0];
	
	$output .= "\t\t[".$om.",";

	$firstpeak = 0;
	$previous = 0;

	for($j = 0, $k = 0; $j < @ls-1 ; $j++){

		if(!$firstpeak){
			# Check for first peak
			if($j > 10){
				# If the points either side are less than or equal to this, we've reached the first peak
				# We'll also add in a check that the value is above the l=2 value to avoid little bumps on the initial dip
				if($cls[$j+1] <= $cls[$j] && $cls[$j-1] < $cls[$j] && $cls[$j] > $cls[0]){
					$firstpeak = 1;
					# We want to step back and check how close the last point was to the first peak
					$output =~ /\,([^\,]+)\,([^\,]+)$/;
					$lastl = $1+0;
					if($lastl > $ls[$j]-25){
						#print $om." ".$lastl." ".$ls[$j]." ".$firstpeak."\n";
						$output =~ s/\,([^\,]+)\,([^\,]+)$//;
					}
					#print "FP = ".$ls[$j]."\n";
				}
			}
			if(!$firstpeak){
				if($ls[$j] == 2 or ($ls[j] lt 10 and $cls[$j] gt $cls[0]) or $ls[$j] == 10 or $ls[$j] == 30 or $ls[$j] == 70 or $ls[$j] == 110 or $ls[$j] == 150 or $ls[$j] == 190 or $ls[$j] == 230 or $ls[$j] == 270 or $ls[$j] == 320 or $ls[$j] == 370 or $ls[$j] == 420 or $ls[$j] == 470 or $ls[$j] == 520 or $ls[$j] == 600 or $ls[$j] == 680 or $ls[$j] == 760 or $ls[$j] == 840 or $ls[$j] == 920 or $ls[$j] == 1000 or $ls[$j] == 1150 or $ls[$j] == 1300 or $ls[$j] == 1450 or $ls[$j] == 1600){
					if($k > 0){ $output .= ","; }
					$output .= "$ls[$j],$cls[$j]";
					#print "Point = ".$ls[$j]."\n";
					$k++;
				}
			}
		}
		
		if($firstpeak and $j > 4 and $j < @ls-4){
			$pre = ($cls[$j-1] + $cls[$j-2] + $cls[$j-3] + $cls[$j-4])/4;
			$aft = ($cls[$j+1] + $cls[$j+2] + $cls[$j+3] + $cls[$j+4])/4;

			if(($aft > $cls[$j] && $pre > $cls[$j]) or ($aft < $cls[$j] && $pre < $cls[$j])){
				if($j > $previous+3){
					$output .= ",$ls[$j],$cls[$j]";
					#print "\tPeak = $omega_l = ".$ls[$j]." ".$pre."=".$cls[$j]."=".$aft."\n";
					$k++;
					$previous = $j;
				}
			}
		}
	}
	$output .= ",".$ls[$j-1].",".$cls[$j-1];
	$output .= "]";

	return $output;

}